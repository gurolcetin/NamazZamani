import { Platform } from 'react-native';
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
  }: SyncOptions): Promise<boolean> {
    this.initialize();
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

    sequence.forEach(entry => {
      const fireDate = new Date(entry.date);
      if (fireDate <= now) {
        fireDate.setDate(fireDate.getDate() + 1);
      }

      const content = buildContent(entry);
      if (!content?.message) {
        return;
      }

      const id = NOTIFICATION_IDS[entry.key] ?? entry.key;
      PushNotification.cancelLocalNotification(id);
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
    });

    return true;
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
