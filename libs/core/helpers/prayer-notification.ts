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
  big_bell: 'prayer-call-channel-big-bell',
};

function getChannelId(sound: string): string {
  return SOUND_CHANNEL_IDS[sound] ?? CHANNEL_ID;
}

// Android: soundName = filename without extension (from res/raw/)
// iOS: soundName = filename with extension (from app bundle)
function resolveSoundName(sound: string): string {
  if (sound === 'default') return 'default';
  return Platform.OS === 'ios' ? `${sound}.mp3` : sound;
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
          channelId: SOUND_CHANNEL_IDS.big_bell,
          channelName: 'Prayer Call Alerts (Big Bell)',
          channelDescription:
            'Plays the Big Bell sound when a prayer time arrives.',
          playSound: true,
          soundName: 'big_bell',
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
    if (enabledKeys && enabledKeys.length === 0) {
      await this.clearStoredNotifications(storeKey);
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

    await this.clearStoredNotifications(storeKey);

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
    LEGACY_NOTIFICATION_IDS.forEach(id => {
      PushNotification.cancelLocalNotification(id);
    });
    try {
      const raw = await AsyncStorage.getItem(storeKey);
      if (!raw) return;
      const ids = JSON.parse(raw) as string[];
      if (!Array.isArray(ids)) return;
      ids.forEach(id => {
        PushNotification.cancelLocalNotification(id);
      });
      await AsyncStorage.removeItem(storeKey);
    } catch (err) {
      console.warn('[prayer-notification] Failed to clear cache', err);
    }
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

    // Check if any notification is enabled
    const anyEnabled = (Object.keys(perPrayer) as PrayerTimeKey[]).some(
      key => perPrayer[key]?.some(item => item.enabled),
    );

    if (!anyEnabled) {
      await this.clearStoredNotifications(storeKey);
      return false;
    }

    if (this.isSilentModeActive(silentModeDuration, silentModeStartedAt, now)) {
      await this.clearStoredNotifications(storeKey);
      return false;
    }

    const granted = await this.requestPermission();
    if (!granted) {
      return false;
    }

    await this.clearStoredNotifications(storeKey);

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

        const numericId = ADVANCED_ID_OFFSET + entryIndex * 20 + itemIndex;
        const id = String(numericId);

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
          userInfo: { type: 'prayer', prayerKey: entry.key },
        });
        scheduledIds.push(id);
      });
    });

    await this.storeScheduledNotifications(storeKey, scheduledIds);
    return true;
  }
}

export const prayerNotificationManager = new PrayerNotificationManager();
