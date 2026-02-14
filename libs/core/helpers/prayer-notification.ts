import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification, { Importance } from 'react-native-push-notification';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  checkNotifications,
  requestNotifications,
  type Permission,
} from 'react-native-permissions';
import { PrayerTimeKey } from '../../common/types';

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
const ANDROID_NOTIFICATION_PERMISSION: Permission =
  ((
    PERMISSIONS as unknown as {
      ANDROID?: Record<string, Permission>;
    }
  )?.ANDROID?.POST_NOTIFICATIONS as Permission | undefined) ??
  ('android.permission.POST_NOTIFICATIONS' as Permission);

const NOTIFICATION_IDS: Record<PrayerTimeKey, string> = {
  Fajr: '201',
  Sunrise: '202',
  Dhuhr: '203',
  Asr: '204',
  Maghrib: '205',
  Isha: '206',
};

const DEFAULT_STORE_KEY = 'prayerNotifications:scheduledIds:v1';

const ymd = (d: Date) => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

class PrayerNotificationManager {
  private initialized = false;

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
    }

    this.initialized = true;
  }

  private async isPermissionGranted(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const { status } = await checkNotifications();
      return status === 'granted' || status === 'limited';
    }

    if (Platform.OS === 'android') {
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
      if (Number.isNaN(version) || version < 33) {
        return true;
      }
      const status = await request(ANDROID_NOTIFICATION_PERMISSION);
      return status === RESULTS.GRANTED;
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

    const allowedSet = enabledKeys
      ? new Set<PrayerTimeKey>(enabledKeys)
      : null;

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

      const id = `${NOTIFICATION_IDS[entry.key] ?? entry.key}-${ymd(
        fireDate,
      )}`;
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
    const legacyIds = Object.values(NOTIFICATION_IDS);
    legacyIds.forEach(id => {
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

  private async storeScheduledNotifications(
    storeKey: string,
    ids: string[],
  ) {
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
}

export const prayerNotificationManager = new PrayerNotificationManager();
