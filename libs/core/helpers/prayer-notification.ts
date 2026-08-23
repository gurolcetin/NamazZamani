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

// Bump this when notification channel configuration changes (e.g. new sounds added).
// Android channels are immutable once created; incrementing this forces recreation.
const CHANNEL_VERSION = 'v5';
const PREVIOUS_CHANNEL_VERSIONS = ['v1', 'v2', 'v3', 'v4'] as const;

const CHANNEL_VERSION_STORE_KEY = 'prayerNotifications:channelVersion';

// Sound keys that have their own dedicated channel
const CUSTOM_SOUND_KEYS = [
  'zil_sesi_1',
  'zil_sesi_2',
  'zil_sesi_3',
  'ezan_sesi1',
  'ezan_sesi2',
  'ezan_sesi3',
] as const;

function buildChannelId(sound: string, version: string): string {
  if (sound === 'default') return `prayer-call-channel-${version}`;
  return `prayer-call-channel-${sound.replace(/_/g, '-')}-${version}`;
}

const CHANNEL_ID = buildChannelId('default', CHANNEL_VERSION);

const SOUND_CHANNEL_IDS: Record<string, string> = {
  default: CHANNEL_ID,
  ...Object.fromEntries(
    CUSTOM_SOUND_KEYS.map(key => [key, buildChannelId(key, CHANNEL_VERSION)]),
  ),
};

function getChannelId(sound: string): string {
  return SOUND_CHANNEL_IDS[sound] ?? CHANNEL_ID;
}

function resolveSoundName(sound: string): string {
  if (sound === 'default') return 'default';
  if (Platform.OS === 'android') return sound;
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
  private androidChannelSyncPromise: Promise<void> | null = null;

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

    this.initialized = true;

    if (Platform.OS === 'android') {
      this.ensureAndroidChannels();
    }
  }

  private ensureAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') {
      return Promise.resolve();
    }

    if (!this.androidChannelSyncPromise) {
      this.androidChannelSyncPromise = this.syncAndroidChannels().catch(
        error => {
          this.androidChannelSyncPromise = null;
          console.warn(
            '[prayer-notification] Failed to sync Android channels',
            error,
          );
        },
      );
    }

    return this.androidChannelSyncPromise;
  }

  private createAndroidChannel(
    channel: Parameters<typeof PushNotification.createChannel>[0],
  ): Promise<void> {
    return new Promise(resolve => {
      PushNotification.createChannel(channel, () => {
        resolve();
      });
    });
  }

  private async syncAndroidChannels(): Promise<void> {
    const storedVersion = await AsyncStorage.getItem(
      CHANNEL_VERSION_STORE_KEY,
    ).catch(() => null);

    const shouldResetChannels = storedVersion !== CHANNEL_VERSION;

    if (shouldResetChannels) {
      const allSoundKeys = ['default', ...CUSTOM_SOUND_KEYS];
      const versionsToDelete = new Set<string>([
        ...PREVIOUS_CHANNEL_VERSIONS,
        ...(storedVersion ? [storedVersion] : []),
      ]);
      versionsToDelete.delete(CHANNEL_VERSION);

      versionsToDelete.forEach(version => {
        allSoundKeys.forEach(key => {
          PushNotification.deleteChannel(buildChannelId(key, version));
        });
      });

      // Also delete the unversioned legacy channels (initial release)
      PushNotification.deleteChannel('prayer-call-channel');
      CUSTOM_SOUND_KEYS.forEach(key => {
        PushNotification.deleteChannel(
          `prayer-call-channel-${key.replace(/_/g, '-')}`,
        );
      });

      await this.clearAllPrayerNotifications();
    }

    // Create/ensure current version channels
    await this.createAndroidChannel(
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
    );
    await Promise.all(
      CUSTOM_SOUND_KEYS.map(key =>
        this.createAndroidChannel({
          channelId: SOUND_CHANNEL_IDS[key],
          channelName: `Prayer Call Alerts (${key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())})`,
          channelDescription: `Plays the ${key} sound when a prayer time arrives.`,
          playSound: true,
          soundName: resolveSoundName(key),
          importance: Importance.HIGH,
          vibrate: true,
        }),
      ),
    );

    await AsyncStorage.setItem(CHANNEL_VERSION_STORE_KEY, CHANNEL_VERSION).catch(
      () => {},
    );
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
    await this.ensureAndroidChannels();
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
    sound: string = 'default',
  ): Promise<boolean> {
    const granted = await this.requestPermission();
    if (!granted) {
      return false;
    }

    this.initialize();
    await this.ensureAndroidChannels();
    PushNotification.localNotificationSchedule({
      id: '299',
      channelId: getChannelId(sound),
      allowWhileIdle: true,
      autoCancel: true,
      playSound: true,
      soundName: resolveSoundName(sound),
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
    await this.ensureAndroidChannels();
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
