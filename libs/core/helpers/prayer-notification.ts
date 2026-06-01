import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification, { Importance } from 'react-native-push-notification';
import {
  canScheduleExactAlarms,
  check,
  request,
  PERMISSIONS,
  RESULTS,
  checkNotifications,
  requestNotifications,
  type Permission,
} from 'react-native-permissions';
import { PrayerTimeKey } from '../../common/types';
import type {
  NotificationItem,
  SilentModeDuration,
} from '../../redux/reducers/AdvancedNotifications';

type SequenceEntry = {
  key: PrayerTimeKey;
  label: string;
  date: Date;
};

type NotificationContent = {
  title: string;
  message: string;
};

export type ScheduledLocalNotification = {
  id?: string | number;
  title?: string;
  message?: string;
  date?: string | number | Date;
  fireDate?: string | number | Date;
  userInfo?: Record<string, unknown>;
  [key: string]: unknown;
};

type SyncOptions = {
  sequence: SequenceEntry[];
  buildContent: (entry: SequenceEntry) => NotificationContent;
  now?: Date;
  enabledKeys?: PrayerTimeKey[];
  shiftPastToNextDay?: boolean;
  storeKey?: string;
};

const CHANNEL_ID = 'prayer-call-channel';

// Per-sound channel IDs for Android (sound is set at channel level on Android 8+)
const SOUND_CHANNEL_IDS: Record<string, string> = {
  default: 'prayer-call-channel',
  zil_sesi_1: 'prayer-call-channel-zil-sesi-1',
  zil_sesi_2: 'prayer-call-channel-zil-sesi-2',
  zil_sesi_3: 'prayer-call-channel-zil-sesi-3',
  ezan_sesi1: 'prayer-call-channel-ezan-sesi-1',
  ezan_sesi2: 'prayer-call-channel-ezan-sesi-2',
  ezan_sesi3: 'prayer-call-channel-ezan-sesi-3',
};

function getChannelId(sound: string): string {
  return SOUND_CHANNEL_IDS[sound] ?? CHANNEL_ID;
}

// Use extension for custom sounds on both platforms to avoid
// vendor-specific parsing bugs in notification channel creation.
function resolveSoundName(sound: string): string {
  if (sound === 'default') return 'default';
  if (sound.startsWith('ezan_sesi')) {
    return `${sound}.wav`;
  }
  return `${sound}.mp3`;
}

const ANDROID_NOTIFICATION_PERMISSION: Permission =
  ((
    PERMISSIONS as unknown as {
      ANDROID?: Record<string, Permission>;
    }
  )?.ANDROID?.POST_NOTIFICATIONS as Permission | undefined) ??
  ('android.permission.POST_NOTIFICATIONS' as Permission);

const LEGACY_NOTIFICATION_IDS = ['201', '202', '203', '204', '205', '206'];
const PRAYER_ID_OFFSETS: Record<PrayerTimeKey, number> = {
  Fajr: 1,
  Sunrise: 2,
  Dhuhr: 3,
  Asr: 4,
  Maghrib: 5,
  Isha: 6,
};

const DEFAULT_STORE_KEY = 'prayerNotifications:scheduledIds:v1';
const ADVANCED_STORE_KEY = 'prayerNotifications:advanced:scheduledIds:v1';
const ADVANCED_ID_OFFSET = 500000;
const KNOWN_STORE_KEYS = [DEFAULT_STORE_KEY, ADVANCED_STORE_KEY] as const;

const SILENT_MODE_DURATIONS_MS: Record<SilentModeDuration, number> = {
  off: 0,
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '5h': 5 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

// Maps JS Date.getDay() (0=Sun) to our day index (0=Mon, 6=Sun)
const jsDayToOurDay = (jsDay: number): number => (jsDay + 6) % 7;

type AdvancedSequenceEntry = {
  key: PrayerTimeKey;
  label: string;
  date: Date;
};

type AdvancedSyncOptions = {
  baseSequence: AdvancedSequenceEntry[];
  perPrayer: Record<PrayerTimeKey, NotificationItem[]>;
  silentModeDuration: SilentModeDuration;
  silentModeStartedAt: string | null;
  buildContent: (
    entry: AdvancedSequenceEntry,
    item: NotificationItem,
  ) => NotificationContent;
  now?: Date;
  storeKey?: string;
};

const toAndroidSchedulableId = (key: PrayerTimeKey, date: Date) => {
  // Android native tarafta id alanı Integer.parseInt ile parse ediliyor.
  // YYYYMMDD + vakit index'i formatı 32-bit int sınırında güvenle kalır.
  const yyyymmdd =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const offset = PRAYER_ID_OFFSETS[key] ?? 0;
  return String(yyyymmdd * 10 + offset);
};

class PrayerNotificationManager {
  private initialized = false;

  private cancelById(id: string | number | undefined) {
    if (id == null) return;
    PushNotification.cancelLocalNotification(String(id));
  }

  private getNotificationId(item: ScheduledLocalNotification): string {
    return item.id != null ? String(item.id) : '';
  }

  private isLikelyPrayerNotification(item: ScheduledLocalNotification): boolean {
    const userInfoType =
      typeof item.userInfo?.type === 'string' ? item.userInfo.type : '';
    if (userInfoType === 'prayer' || userInfoType === 'prayer-test') {
      return true;
    }

    const id = this.getNotificationId(item);
    if (!id) return false;
    if (LEGACY_NOTIFICATION_IDS.includes(id)) return true;
    if (/^20\d{6}[1-6]$/.test(id)) return true;

    const numericId = Number(id);
    if (Number.isFinite(numericId) && numericId >= ADVANCED_ID_OFFSET) {
      return true;
    }

    return false;
  }

  private async hasAndroidExactAlarmPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    const version = Number(Platform.Version);
    if (Number.isNaN(version) || version < 31) {
      return true;
    }

    try {
      return await canScheduleExactAlarms();
    } catch {
      return false;
    }
  }

  initialize() {
    if (this.initialized) {
      return;
    }

    PushNotification.configure({
      onRegister: () => {},
      onNotification: () => {},
      popInitialNotification: true,
      requestPermissions: false,
    });

    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: CHANNEL_ID,
          channelName: 'Prayer Call Alerts',
          channelDescription:
            'Plays an audible reminder when a prayer time arrives.',
          playSound: true,
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        () => {},
      );
      PushNotification.createChannel(
        {
          channelId: SOUND_CHANNEL_IDS.zil_sesi_1,
          channelName: 'Prayer Call Alerts (Zil Sesi 1)',
          channelDescription:
            'Plays the Zil Sesi 1 sound when a prayer time arrives.',
          playSound: true,
          soundName: resolveSoundName('zil_sesi_1'),
          importance: Importance.HIGH,
          vibrate: true,
        },
        () => {},
      );
      PushNotification.createChannel(
        {
          channelId: SOUND_CHANNEL_IDS.zil_sesi_2,
          channelName: 'Prayer Call Alerts (Zil Sesi 2)',
          channelDescription:
            'Plays the Zil Sesi 2 sound when a prayer time arrives.',
          playSound: true,
          soundName: resolveSoundName('zil_sesi_2'),
          importance: Importance.HIGH,
          vibrate: true,
        },
        () => {},
      );
      PushNotification.createChannel(
        {
          channelId: SOUND_CHANNEL_IDS.zil_sesi_3,
          channelName: 'Prayer Call Alerts (Zil Sesi 3)',
          channelDescription:
            'Plays the Zil Sesi 3 sound when a prayer time arrives.',
          playSound: true,
          soundName: resolveSoundName('zil_sesi_3'),
          importance: Importance.HIGH,
          vibrate: true,
        },
        () => {},
      );
      PushNotification.createChannel(
        {
          channelId: SOUND_CHANNEL_IDS.ezan_sesi1,
          channelName: 'Prayer Call Alerts (Ezan Sesi 1)',
          channelDescription:
            'Plays the Ezan Sesi 1 sound when a prayer time arrives.',
          playSound: true,
          soundName: resolveSoundName('ezan_sesi1'),
          importance: Importance.HIGH,
          vibrate: true,
        },
        () => {},
      );
      PushNotification.createChannel(
        {
          channelId: SOUND_CHANNEL_IDS.ezan_sesi2,
          channelName: 'Prayer Call Alerts (Ezan Sesi 2)',
          channelDescription:
            'Plays the Ezan Sesi 2 sound when a prayer time arrives.',
          playSound: true,
          soundName: resolveSoundName('ezan_sesi2'),
          importance: Importance.HIGH,
          vibrate: true,
        },
        () => {},
      );
      PushNotification.createChannel(
        {
          channelId: SOUND_CHANNEL_IDS.ezan_sesi3,
          channelName: 'Prayer Call Alerts (Ezan Sesi 3)',
          channelDescription:
            'Plays the Ezan Sesi 3 sound when a prayer time arrives.',
          playSound: true,
          soundName: resolveSoundName('ezan_sesi3'),
          importance: Importance.HIGH,
          vibrate: true,
        },
        () => {},
      );
    }

    this.initialized = true;
  }

  private async isPermissionGranted(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const { status } = await checkNotifications();
      return status === 'granted' || status === 'limited';
    }

    if (Platform.OS === 'android') {
      const exactAlarmGranted = await this.hasAndroidExactAlarmPermission();
      if (!exactAlarmGranted) {
        return false;
      }

      const version = Number(Platform.Version);
      if (Number.isNaN(version) || version < 33) {
        return true;
      }
      const status = await check(ANDROID_NOTIFICATION_PERMISSION);
      return status === RESULTS.GRANTED;
    }

    return true;
  }

  async hasPermission(): Promise<boolean> {
    this.initialize();
    return this.isPermissionGranted();
  }

  async requestPermission(): Promise<boolean> {
    this.initialize();
    if (await this.isPermissionGranted()) {
      return true;
    }

    if (Platform.OS === 'ios') {
      const { status } = await requestNotifications([
        'alert',
        'sound',
        'badge',
      ]);
      return status === 'granted' || status === 'limited';
    }

    if (Platform.OS === 'android') {
      const version = Number(Platform.Version);
      if (!Number.isNaN(version) && version >= 33) {
        const status = await request(ANDROID_NOTIFICATION_PERMISSION);
        if (status !== RESULTS.GRANTED) {
          return false;
        }
      }

      return this.hasAndroidExactAlarmPermission();
    }

    return false;
  }

  async syncDailyNotifications({
    sequence,
    buildContent,
    now = new Date(),
    enabledKeys,
    shiftPastToNextDay = true,
    storeKey = DEFAULT_STORE_KEY,
  }: SyncOptions): Promise<boolean> {
    this.initialize();
    await this.clearAllPrayerNotifications([storeKey]);

    if (enabledKeys && enabledKeys.length === 0) {
      return false;
    }
    if (!sequence?.length) {
      return false;
    }

    const granted = await this.requestPermission();
    if (!granted) {
      return false;
    }

    const allowedSet = enabledKeys ? new Set<PrayerTimeKey>(enabledKeys) : null;

    const scheduledIds: string[] = [];
    sequence.forEach(entry => {
      const fireDate = new Date(entry.date);
      if (fireDate <= now) {
        if (!shiftPastToNextDay) {
          return;
        }
        fireDate.setDate(fireDate.getDate() + 1);
      }

      const content = buildContent(entry);
      if (!content?.message) {
        return;
      }

      const id = toAndroidSchedulableId(entry.key, fireDate);
      if (allowedSet && !allowedSet.has(entry.key)) {
        return;
      }
      PushNotification.localNotificationSchedule({
        id,
        channelId: CHANNEL_ID,
        allowWhileIdle: true,
        autoCancel: true,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        title: content.title,
        message: content.message,
        date: fireDate,
        userInfo: { type: 'prayer', prayerKey: entry.key },
      });
      scheduledIds.push(id);
    });

    await this.storeScheduledNotifications(storeKey, scheduledIds);
    return true;
  }

  private async clearStoredNotifications(storeKey: string) {
    try {
      const raw = await AsyncStorage.getItem(storeKey);
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        if (Array.isArray(ids)) {
          ids.forEach(id => {
            this.cancelById(id);
          });
        }
      }
      await AsyncStorage.removeItem(storeKey);
    } catch (err) {
      console.warn('[prayer-notification] Failed to clear cache', err);
      try {
        await AsyncStorage.removeItem(storeKey);
      } catch {
        // ignore secondary cleanup error
      }
    }
  }

  private async clearAllPrayerNotifications(extraStoreKeys: string[] = []) {
    LEGACY_NOTIFICATION_IDS.forEach(id => this.cancelById(id));

    const storeKeys = Array.from(
      new Set<string>([...KNOWN_STORE_KEYS, ...extraStoreKeys]),
    );
    for (const storeKey of storeKeys) {
      await this.clearStoredNotifications(storeKey);
    }

    try {
      const scheduled = await this.getScheduledLocalNotifications();
      scheduled.forEach(item => {
        if (this.isLikelyPrayerNotification(item)) {
          this.cancelById(item.id);
        }
      });
    } catch (err) {
      console.warn('[prayer-notification] Failed to clear scheduled list', err);
    }
  }

  async clearPrayerNotifications(): Promise<void> {
    this.initialize();
    await this.clearAllPrayerNotifications();
  }

  private async storeScheduledNotifications(storeKey: string, ids: string[]) {
    try {
      if (!ids.length) {
        await AsyncStorage.removeItem(storeKey);
        return;
      }
      await AsyncStorage.setItem(storeKey, JSON.stringify(ids));
    } catch (err) {
      console.warn('[prayer-notification] Failed to store cache', err);
    }
  }

  async sendTestNotification(
    content: NotificationContent,
    delayMs = 2500,
  ): Promise<boolean> {
    const granted = await this.requestPermission();
    if (!granted) {
      return false;
    }

    this.initialize();
    PushNotification.localNotificationSchedule({
      id: '299',
      channelId: CHANNEL_ID,
      allowWhileIdle: true,
      autoCancel: true,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      title: content.title,
      message: content.message,
      date: new Date(Date.now() + delayMs),
      userInfo: { type: 'prayer-test' },
    });
    return true;
  }

  async getScheduledLocalNotifications(): Promise<ScheduledLocalNotification[]> {
    this.initialize();

    const pushNotification = PushNotification as unknown as {
      getScheduledLocalNotifications?: (
        callback: (notifications: ScheduledLocalNotification[]) => void,
      ) => void;
    };

    return new Promise(resolve => {
      if (typeof pushNotification.getScheduledLocalNotifications !== 'function') {
        resolve([]);
        return;
      }

      try {
        pushNotification.getScheduledLocalNotifications(notifications => {
          resolve(Array.isArray(notifications) ? notifications : []);
        });
      } catch {
        resolve([]);
      }
    });
  }

  isSilentModeActive(
    duration: SilentModeDuration,
    startedAt: string | null,
    now: Date = new Date(),
  ): boolean {
    if (duration === 'off') return false;
    if (!startedAt) return false;
    const start = new Date(startedAt).getTime();
    const durationMs = SILENT_MODE_DURATIONS_MS[duration] ?? 0;
    return now.getTime() < start + durationMs;
  }

  async syncAdvancedNotifications({
    baseSequence,
    perPrayer,
    silentModeDuration,
    silentModeStartedAt,
    buildContent,
    now = new Date(),
    storeKey = ADVANCED_STORE_KEY,
  }: AdvancedSyncOptions): Promise<boolean> {
    this.initialize();
    await this.clearAllPrayerNotifications([storeKey]);

    // Check if any notification is enabled
    const anyEnabled = (Object.keys(perPrayer) as PrayerTimeKey[]).some(
      key => perPrayer[key]?.some(item => item.enabled),
    );

    if (!anyEnabled) {
      return false;
    }

    if (this.isSilentModeActive(silentModeDuration, silentModeStartedAt, now)) {
      return false;
    }

    const granted = await this.requestPermission();
    if (!granted) {
      return false;
    }

    const scheduledIds: string[] = [];
    baseSequence.forEach((entry, entryIndex) => {
      const items = perPrayer[entry.key] ?? [];
      items.forEach((notifItem, itemIndex) => {
        if (!notifItem.enabled) return;

        // Check day of week (days[0]=Mon, days[6]=Sun)
        const dayOfWeek = jsDayToOurDay(entry.date.getDay());
        if (!notifItem.days[dayOfWeek]) return;

        const fireDate = new Date(
          entry.date.getTime() + notifItem.offsetMinutes * 60 * 1000,
        );
        if (fireDate <= now) return;

        const content = buildContent(entry, notifItem);
        if (!content?.message) return;

        // Keep deterministic and unique IDs for primary + snooze notifications.
        const baseNumericId =
          ADVANCED_ID_OFFSET + entryIndex * 1000 + itemIndex * 10;
        const id = String(baseNumericId);

        PushNotification.localNotificationSchedule({
          id,
          channelId: getChannelId(notifItem.sound),
          allowWhileIdle: true,
          autoCancel: true,
          playSound: true,
          soundName: resolveSoundName(notifItem.sound),
          importance: 'high',
          title: content.title,
          message: content.message,
          date: fireDate,
          userInfo: {
            type: 'prayer',
            prayerKey: entry.key,
            sourceItemId: notifItem.id,
            isSnooze: false,
          },
        });
        scheduledIds.push(id);

        if (notifItem.snoozeMinutes > 0) {
          const snoozeFireDate = new Date(
            fireDate.getTime() + notifItem.snoozeMinutes * 60 * 1000,
          );
          if (snoozeFireDate > now) {
            const snoozeId = String(baseNumericId + 1);
            PushNotification.localNotificationSchedule({
              id: snoozeId,
              channelId: getChannelId(notifItem.sound),
              allowWhileIdle: true,
              autoCancel: true,
              playSound: true,
              soundName: resolveSoundName(notifItem.sound),
              importance: 'high',
              title: content.title,
              message: content.message,
              date: snoozeFireDate,
              userInfo: {
                type: 'prayer',
                prayerKey: entry.key,
                sourceItemId: notifItem.id,
                isSnooze: true,
                snoozeMinutes: notifItem.snoozeMinutes,
              },
            });
            scheduledIds.push(snoozeId);
          }
        }
      });
    });

    await this.storeScheduledNotifications(storeKey, scheduledIds);
    return true;
  }
}

export const prayerNotificationManager = new PrayerNotificationManager();
