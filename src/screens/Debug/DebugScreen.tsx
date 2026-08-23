import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import {
  BottomTabScreenViewContainer,
  Icon,
  Icons,
  SafeAreaWithStatusBar,
} from '../../../libs/components';
import {
  DEFAULT_PRAYER_TIME_TUNE,
  PrayerTimeKey,
  PrayerTimeTuneSettings,
} from '../../../libs/common/types';
import { useTheme } from '../../../libs/core/providers';
import {
  getTimeZoneByCoords,
  getUtcLabelFromTimeZone,
} from '../../../libs/core/helpers';
import {
  DEVICE_METHOD_KEY,
  setDebugReligiousDaysDate,
} from '../../../libs/redux/reducers/ApplicationSettings';
import { selectActiveResolved } from '../../../libs/redux/reducers/location';
import {
  savePrayerSnapshot,
  selectPrayerSnapshot,
} from '../../../libs/redux/reducers/prayerTimesCache';
import type { AppDispatch, RootState } from '../../../libs/redux/store';
import {
  prayerNotificationManager,
  type ScheduledLocalNotification,
} from '../../../libs/core/helpers/prayer-notification';
import {
  fetchPrayerTimesByCoords,
  tuneSettingsToArray,
} from '../PrayerTime/api';
import {
  getCurrentPosition,
  requestLocationPermission,
} from '../PrayerTime/permission';
import { getUTCLabel, reverseGeocode } from '../PrayerTime/reverse-geocode';
import { convertMiladiDateToHicriDate } from '../../../libs/core/helpers/hicriDate.helper';

const PRAYER_ORDER: PrayerTimeKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

const DEFAULT_METHOD_ID = 13;

const PRAYER_NAME_KEYS: Record<PrayerTimeKey, string> = {
  Fajr: 'prayerNames.Fajr',
  Sunrise: 'prayerNames.Sunrise',
  Dhuhr: 'prayerNames.Dhuhr',
  Asr: 'prayerNames.Asr',
  Maghrib: 'prayerNames.Maghrib',
  Isha: 'prayerNames.Isha',
};

function ymd(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateFromYMD(value: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseClockToMinutes(hhmm: string) {
  const pureTime = hhmm.split(' ')[0];
  const [hour, minute] = pureTime.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return hour * 60 + minute;
}

function diffInMinutes(base: string, tuned: string) {
  const baseMin = parseClockToMinutes(base);
  const tunedMin = parseClockToMinutes(tuned);
  if (baseMin == null || tunedMin == null) {
    return null;
  }
  return tunedMin - baseMin;
}

function parseNotificationDate(
  notification: ScheduledLocalNotification,
): Date | null {
  const rawDate = notification.date ?? notification.fireDate;
  if (rawDate == null) return null;
  if (rawDate instanceof Date) {
    return Number.isNaN(rawDate.getTime()) ? null : rawDate;
  }
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type DebugAction = {
  id: string;
  labelKey: string;
  icon: string;
  onPress: () => void;
};

const DebugScreen = () => {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const activeResolved = useSelector(selectActiveResolved);
  const cachedPrayerSnapshot = useSelector(selectPrayerSnapshot);
  const applicationSettings = useSelector(
    (state: RootState) => state.applicationSettings,
  );
  const debugReligiousDaysDate =
    applicationSettings?.debugReligiousDaysDate ?? null;
  const prayerTimeTune =
    applicationSettings?.prayerTimeTune ?? DEFAULT_PRAYER_TIME_TUNE;
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notifications, setNotifications] = useState<
    ScheduledLocalNotification[]
  >([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const styles = useMemo(
    () =>
      createStyles({
        bg: currentTheme.backgroundColor,
        cardBg: currentTheme.cardViewBackgroundColor,
        border: currentTheme.cardViewBorderColor || `${currentTheme.primary}33`,
        primary: currentTheme.primary,
        text: currentTheme.textColor,
        muted: currentTheme.placeholderTextColor || '#6B7280',
      }),
    [currentTheme],
  );

  const selectedDebugDate = useMemo(
    () => dateFromYMD(debugReligiousDaysDate),
    [debugReligiousDaysDate],
  );

  const selectedDateLabel = useMemo(() => {
    const date = selectedDebugDate ?? new Date();
    return date.toLocaleDateString(i18n.language || undefined, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [i18n.language, selectedDebugDate]);

  const prayerLabels = useMemo(
    () =>
      PRAYER_ORDER.reduce((acc, key) => {
        acc[key] = t(PRAYER_NAME_KEYS[key]);
        return acc;
      }, {} as Record<PrayerTimeKey, string>),
    [t],
  );

  const effectiveTuneOffsets = useMemo(
    () => tuneSettingsToArray(prayerTimeTune as PrayerTimeTuneSettings),
    [prayerTimeTune],
  );

  const methodKey =
    activeResolved.type === 'device' ? DEVICE_METHOD_KEY : activeResolved.id;

  const methodId =
    applicationSettings?.prayerTimeMethodPreferences?.[methodKey]?.methodId ??
    applicationSettings?.prayerTimeMethod ??
    DEFAULT_METHOD_ID;

  const resolveCoords = useCallback(async () => {
    if (activeResolved.type === 'saved') {
      return {
        coords: { lat: activeResolved.latitude, lon: activeResolved.longitude },
        locationLabel: activeResolved.label,
      };
    }

    const granted = await requestLocationPermission();
    if (granted) {
      const pos = await getCurrentPosition();
      const coords = { lat: pos.latitude, lon: pos.longitude };
      const label = await reverseGeocode(coords.lat, coords.lon);
      return {
        coords,
        locationLabel: label ?? t('locationSelector.deviceTitle'),
      };
    }

    if (cachedPrayerSnapshot.coords) {
      return {
        coords: cachedPrayerSnapshot.coords,
        locationLabel:
          cachedPrayerSnapshot.locationLabel ??
          t('locationSelector.deviceTitle'),
      };
    }

    throw new Error('Missing location');
  }, [activeResolved, cachedPrayerSnapshot, t]);

  const getUtcLabel = useCallback(async (lat: number, lon: number) => {
    const timeZone = getTimeZoneByCoords(lat, lon);
    return timeZone ? getUtcLabelFromTimeZone(timeZone) : getUTCLabel();
  }, []);

  const runAction = useCallback(
    async (id: string, action: () => Promise<void>) => {
      setLoadingAction(id);
      try {
        await action();
      } catch (error) {
        console.warn(`[debug] action failed: ${id}`, error);
        Alert.alert(t('debug.title'), t('debug.actionFailed'));
      } finally {
        setLoadingAction(null);
      }
    },
    [t],
  );

  const handleReloadPrayerTimes = useCallback(
    () =>
      runAction('reloadPrayerTimes', async () => {
        const { coords, locationLabel } = await resolveCoords();
        const date = new Date();
        const timings = await fetchPrayerTimesByCoords(
          coords.lat,
          coords.lon,
          date,
          methodId,
          { tune: effectiveTuneOffsets },
        );
        const utcLabel = await getUtcLabel(coords.lat, coords.lon);

        dispatch(
          savePrayerSnapshot({
            timings,
            locationLabel,
            utcLabel,
            coords,
            sequenceBaseDate: date.toISOString(),
          }),
        );

        Alert.alert(t('debug.reloadPrayerTimes'), t('debug.actionCompleted'));
      }),
    [
      dispatch,
      effectiveTuneOffsets,
      getUtcLabel,
      methodId,
      resolveCoords,
      runAction,
      t,
    ],
  );

  const handleConvertHijriDate = useCallback(
    () =>
      runAction('convertHijriDate', async () => {
        const date = selectedDebugDate ?? new Date();
        const hijriDate = await convertMiladiDateToHicriDate(date);
        Alert.alert(
          t('debug.convertHijriDate'),
          [
            `${t('debug.gregorianDate')}: ${selectedDateLabel}`,
            `${t('debug.hijriDate')}: ${hijriDate.dayOfMonth} ${
              hijriDate.monthText
            } ${hijriDate.year}`,
            `Raw: ${hijriDate.rawHijriDate}`,
            `Method: ${hijriDate.method}`,
          ].join('\n'),
        );
      }),
    [runAction, selectedDateLabel, selectedDebugDate, t],
  );

  const handleSendTestNotification = useCallback(
    () =>
      runAction('testNotification', async () => {
        const sent = await prayerNotificationManager.sendTestNotification(
          {
            title: t('notifications.testTitle'),
            message: t('notifications.testBody'),
          },
          2500,
          'ezan_sesi1',
        );

        if (!sent) {
          Alert.alert(
            t('notifications.permissionDeniedTitle'),
            t('notifications.permissionDeniedMessage'),
          );
          return;
        }

        Alert.alert(
          t('notifications.testTitle'),
          t('notifications.testScheduledMessage'),
        );
      }),
    [runAction, t],
  );

  const handleComparePrayerTimes = useCallback(
    () =>
      runAction('comparePrayerTimes', async () => {
        const { coords } = await resolveCoords();
        const date = selectedDebugDate ?? new Date();
        const untunedData = await fetchPrayerTimesByCoords(
          coords.lat,
          coords.lon,
          date,
          methodId,
          { tune: null },
        );
        const tunedData = await fetchPrayerTimesByCoords(
          coords.lat,
          coords.lon,
          date,
          methodId,
          { tune: effectiveTuneOffsets },
        );

        const lines = PRAYER_ORDER.map(key => {
          const untuned = untunedData[key];
          const tuned = tunedData[key];
          const diff = diffInMinutes(untuned, tuned);
          const diffText =
            diff == null ? '?' : `${diff > 0 ? '+' : ''}${diff} dk`;
          return `${prayerLabels[key]}: ${untuned} | ${tuned} (${diffText})`;
        });

        Alert.alert(
          t('debug.comparePrayerTimes'),
          [
            `${t('debug.gregorianDate')}: ${selectedDateLabel}`,
            `Method: ${methodId}`,
            `Tune: ${effectiveTuneOffsets.join(',')}`,
            '',
            ...lines,
          ].join('\n'),
        );
      }),
    [
      effectiveTuneOffsets,
      methodId,
      prayerLabels,
      resolveCoords,
      runAction,
      selectedDateLabel,
      selectedDebugDate,
      t,
    ],
  );

  const loadScheduledNotifications = useCallback(
    () =>
      runAction('scheduledNotifications', async () => {
        const scheduled =
          await prayerNotificationManager.getScheduledLocalNotifications();
        const sorted = [...scheduled].sort((a, b) => {
          const aTime =
            parseNotificationDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const bTime =
            parseNotificationDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        });
        const expanded: Record<string, boolean> = {};
        sorted.forEach(item => {
          const dateObj = parseNotificationDate(item);
          expanded[dateObj ? ymd(dateObj) : 'undated'] = true;
        });
        setNotifications(sorted);
        setExpandedDays(expanded);
      }),
    [runAction],
  );

  const notificationGroups = useMemo(() => {
    const grouped = new Map<
      string,
      {
        label: string;
        sortTs: number;
        items: ScheduledLocalNotification[];
      }
    >();

    notifications.forEach(notification => {
      const dateObj = parseNotificationDate(notification);
      const dayKey = dateObj ? ymd(dateObj) : 'undated';
      const label = dateObj
        ? dateObj.toLocaleDateString(i18n.language || undefined, {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : t('debug.undatedNotifications');
      const sortTs = dateObj
        ? new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate(),
          ).getTime()
        : Number.MAX_SAFE_INTEGER;

      const existing = grouped.get(dayKey);
      if (existing) {
        existing.items.push(notification);
      } else {
        grouped.set(dayKey, { label, sortTs, items: [notification] });
      }
    });

    return Array.from(grouped.entries())
      .map(([key, value]) => ({
        key,
        ...value,
        items: value.items.sort((a, b) => {
          const aTime =
            parseNotificationDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const bTime =
            parseNotificationDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        }),
      }))
      .sort((a, b) => a.sortTs - b.sortTs);
  }, [i18n.language, notifications, t]);

  const handleDebugDateChange = useCallback(
    (event: any, picked?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
        if (event?.type === 'dismissed') {
          return;
        }
      }
      if (picked) {
        dispatch(setDebugReligiousDaysDate(ymd(picked)));
      }
    },
    [dispatch],
  );

  const actions: DebugAction[] = [
    {
      id: 'reloadPrayerTimes',
      labelKey: 'debug.reloadPrayerTimes',
      icon: 'refresh',
      onPress: handleReloadPrayerTimes,
    },
    {
      id: 'convertHijriDate',
      labelKey: 'debug.convertHijriDate',
      icon: 'calendar-refresh',
      onPress: handleConvertHijriDate,
    },
    {
      id: 'comparePrayerTimes',
      labelKey: 'debug.comparePrayerTimes',
      icon: 'calculator-variant',
      onPress: handleComparePrayerTimes,
    },
    {
      id: 'testNotification',
      labelKey: 'debug.testNotification',
      icon: 'bell-ring-outline',
      onPress: handleSendTestNotification,
    },
    {
      id: 'scheduledNotifications',
      labelKey: 'debug.scheduledNotifications',
      icon: 'format-list-bulleted',
      onPress: loadScheduledNotifications,
    },
  ];

  return (
    <SafeAreaWithStatusBar>
      <BottomTabScreenViewContainer>
        <ScrollView
          style={[
            styles.container,
            { backgroundColor: currentTheme.backgroundColor },
          ]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('debug.actionsTitle')}</Text>
            {actions.map(action => {
              const isLoading = loadingAction === action.id;
              return (
                <Pressable
                  key={action.id}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={action.onPress}
                  disabled={loadingAction != null}
                >
                  <Icon
                    type={Icons.MaterialDesignIcons}
                    name={action.icon}
                    size={20}
                    color={currentTheme.primary}
                  />
                  <Text style={styles.actionText}>{t(action.labelKey)}</Text>
                  {isLoading && (
                    <ActivityIndicator
                      size="small"
                      color={currentTheme.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('debug.religiousDaysDateTitle')}
            </Text>
            <Text style={styles.valueText}>{selectedDateLabel}</Text>
            <View style={styles.inlineActions}>
              <Pressable
                style={styles.smallButton}
                onPress={() => setShowDatePicker(prev => !prev)}
              >
                <Text style={styles.smallButtonText}>
                  {t('monthlyCalendar.changeDate')}
                </Text>
              </Pressable>
              {debugReligiousDaysDate && (
                <Pressable
                  style={styles.smallButton}
                  onPress={() => dispatch(setDebugReligiousDaysDate(null))}
                >
                  <Text style={styles.smallButtonText}>
                    {t('monthlyCalendar.today')}
                  </Text>
                </Pressable>
              )}
            </View>
            {showDatePicker && (
              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  mode="date"
                  value={selectedDebugDate ?? new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  accentColor={currentTheme.primary}
                  locale={i18n.language}
                  onChange={handleDebugDateChange}
                />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('debug.scheduledNotificationsTitle', {
                count: notifications.length,
              })}
            </Text>
            {notificationGroups.length === 0 ? (
              <Text style={styles.emptyText}>
                {t('debug.noScheduledNotifications')}
              </Text>
            ) : (
              notificationGroups.map(group => {
                const expanded = !!expandedDays[group.key];
                return (
                  <View key={group.key} style={styles.dayCard}>
                    <Pressable
                      style={styles.dayHeader}
                      onPress={() =>
                        setExpandedDays(prev => ({
                          ...prev,
                          [group.key]: !prev[group.key],
                        }))
                      }
                    >
                      <View style={styles.dayHeaderText}>
                        <Text style={styles.dayTitle}>{group.label}</Text>
                        <Text style={styles.dayCount}>
                          {t('debug.notificationCount', {
                            count: group.items.length,
                          })}
                        </Text>
                      </View>
                      <Icon
                        type={Icons.MaterialDesignIcons}
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={currentTheme.primary}
                      />
                    </Pressable>
                    {expanded && (
                      <View style={styles.notificationList}>
                        {group.items.map((item, index) => {
                          const dateObj = parseNotificationDate(item);
                          const timeText = dateObj
                            ? dateObj.toLocaleTimeString(
                                i18n.language || undefined,
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )
                            : t('debug.noTime');
                          const idText =
                            item.id != null ? String(item.id) : '-';
                          const titleText =
                            typeof item.title === 'string' && item.title.trim()
                              ? item.title
                              : t('debug.noTitle');
                          const messageText =
                            typeof item.message === 'string' &&
                            item.message.trim()
                              ? item.message
                              : t('debug.noMessage');

                          return (
                            <View
                              key={`${group.key}-${idText}-${index}`}
                              style={styles.notificationItem}
                            >
                              <Text style={styles.notificationMeta}>
                                {timeText} - id: {idText}
                              </Text>
                              <Text style={styles.notificationTitle}>
                                {titleText}
                              </Text>
                              <Text style={styles.notificationMessage}>
                                {messageText}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </BottomTabScreenViewContainer>
    </SafeAreaWithStatusBar>
  );
};

const createStyles = (colors: {
  bg: string;
  cardBg: string;
  border: string;
  primary: string;
  text: string;
  muted: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 14,
      backgroundColor: colors.bg,
    },
    section: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
      padding: 14,
      gap: 10,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    actionButton: {
      minHeight: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    pressed: {
      opacity: 0.72,
    },
    actionText: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    valueText: {
      color: colors.muted,
      fontSize: 14,
    },
    inlineActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    smallButton: {
      borderRadius: 10,
      backgroundColor: `${colors.primary}18`,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    smallButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    datePickerWrap: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    emptyText: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
    },
    dayCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    dayHeader: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    dayHeaderText: {
      flex: 1,
    },
    dayTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    dayCount: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 2,
    },
    notificationList: {
      paddingHorizontal: 10,
      paddingBottom: 10,
      gap: 8,
    },
    notificationItem: {
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    notificationMeta: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 4,
    },
    notificationTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 2,
    },
    notificationMessage: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
    },
  });

export default DebugScreen;
