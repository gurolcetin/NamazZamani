// src/features/prayer/PrayerTime.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { PrayerTimings, fetchPrayerTimesByCoords } from './api';
import {
  requestLocationPermission,
  getCurrentPosition,
  hasLocationPermission,
} from './permission';
import {
  BottomTabScreenViewContainer,
  Icon,
  Icons,
  PRAYER_TIME_ICONS,
  PrayerTimeSmallCard,
  SafeAreaWithStatusBar,
} from '../../../libs/components';
import { useTheme } from '../../../libs/core/providers';
import { reverseGeocode, getUTCLabel } from './reverse-geocode';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { PrayerTimeScreens } from '../../navigation/Routes';
import {
  selectActiveResolved,
  selectSavedPlaces,
  setActiveById,
} from '../../../libs/redux/reducers/location';
import {
  getTimeZoneByCoords,
  getUtcLabelFromTimeZone,
  getFontScaleMultiplier,
} from '../../../libs/core/helpers';
import { ActionCardGroup } from './action-cards/action-card-group';
import {
  AsmaulHusnaCard,
  HadithCard,
  QuranAyahCard,
} from './inspiration-cards';
import PrayerTimeSkeleton from './prayer-time-skeleton';
import { PrayerTimeKey, SmallCard } from '../../../libs/common/types';
import {
  LanguageLocaleKeys,
  LanguagePrefix,
} from '../../../libs/common/constants';
import { useTranslation } from 'react-i18next';
import RamadanIcon from '../../../libs/components/svg/icons/ramadan-icon';
import { convertMiladiDateToHicriDate } from '../../../libs/core/helpers/hicriDate.helper';
import type { RootState } from '../../../libs/redux/store';
import { prayerNotificationManager } from '../../../libs/core/helpers/prayer-notification';
import { FontScaleOption } from '../../../libs/common/enums';
import {
  savePrayerSnapshot,
  saveRamadanSnapshot,
  selectPrayerSnapshot,
  selectRamadanSnapshot,
} from '../../../libs/redux/reducers/prayerTimesCache';

// ----- Types & Maps ---------------------------------------------------------

const PRAYER_ORDER: PrayerTimeKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

type LatLng = { lat: number; lon: number };

const LOCATION_CHANGE_THRESHOLD_KM = 3; // şehir değişimi için yaklaşık eşik
const PRAYER_NAME_KEYS: Record<PrayerTimeKey, string> = {
  Fajr: 'prayerNames.Fajr',
  Sunrise: 'prayerNames.Sunrise',
  Dhuhr: 'prayerNames.Dhuhr',
  Asr: 'prayerNames.Asr',
  Maghrib: 'prayerNames.Maghrib',
  Isha: 'prayerNames.Isha',
};

// ----- Time helpers ---------------------------------------------------------
function toTodayDate(hhmm: string, base = new Date()): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}
function fmtClock(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    sec,
  ).padStart(2, '0')}`;
}
function progressBetween(start: Date, end: Date, now = new Date()) {
  const span = end.getTime() - start.getTime();
  if (span <= 0) return 0;
  const passed = now.getTime() - start.getTime();
  return Math.min(1, Math.max(0, passed / span));
}
function buildSequence(
  t: PrayerTimings,
  labels: Record<PrayerTimeKey, string>,
) {
  const today = new Date();
  return PRAYER_ORDER.map(k => ({
    key: k,
    label: labels[k] ?? k,
    time: t[k],
    date: toTodayDate(t[k], today),
  }));
}

// İftar ve sahur hedeflerini hesaplayan helper
function getIftarAndSahurTargets(t: PrayerTimings, base = new Date()) {
  const now = base;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fajrToday = toTodayDate(t.Fajr, today);
  const maghribToday = toTodayDate(t.Maghrib, today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const fajrTomorrow = toTodayDate(t.Fajr, tomorrow);
  const maghribTomorrow = toTodayDate(t.Maghrib, tomorrow);

  // İftar hedefi: bir sonraki Maghrib
  const iftarTarget = now < maghribToday ? maghribToday : maghribTomorrow;

  // Sahur hedefi: bir sonraki Fajr
  const sahurTarget = now < fajrToday ? fajrToday : fajrTomorrow;

  return { iftarTarget, sahurTarget, maghribToday, fajrToday };
}

function computeNext(seq: ReturnType<typeof buildSequence>, now = new Date()) {
  for (let i = 0; i < seq.length; i++) {
    if (now < seq[i].date) {
      const next = seq[i];
      const prev = i === 0 ? seq[seq.length - 1] : seq[i - 1];
      const start = prev.date;
      const end = next.date;
      return {
        prev,
        next,
        leftSec: (end.getTime() - now.getTime()) / 1000,
        progress: progressBetween(start, end, now),
      };
    }
  }
  const last = seq[seq.length - 1];
  const fajr = seq[0];
  const fajrTomorrow = new Date(fajr.date);
  fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
  return {
    prev: last,
    next: { ...fajr, date: fajrTomorrow },
    leftSec: (fajrTomorrow.getTime() - now.getTime()) / 1000,
    progress: progressBetween(last.date, fajrTomorrow, now),
  };
}

// ---- Flicker guard helpers -------------------------------------------------
function ymd(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0'); // getMonth 0-based
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const getCurrentDateKey = (d: Date) => ymd(d);
const MAX_SPAN_SEC = 26 * 3600; // güvenli üst sınır (clamp)

function haversineDistanceKm(a: LatLng, b: LatLng) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Dünya yarıçapı
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------------------------------------------------------------------------
// HOISTED HEADER COMPONENT (FlatList ListHeader dışarı alındı)
// ---------------------------------------------------------------------------
type HeaderProps = {
  cardBg: string;
  iconType: any;
  iconName: string;
  countdownTitle: string;
  leftClock: string;
  isResyncing: boolean;
  seqDateLabel: string;
};

const PrayerTimeHeader: React.FC<HeaderProps> = memo(
  ({
    cardBg,
    iconType,
    iconName,
    countdownTitle,
    leftClock,
    isResyncing,
    seqDateLabel,
  }) => {
    const fontScalePreference = useSelector(
      (state: RootState) =>
        state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
    );
    const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);
    const baseIconSize = 26 * fontScaleMultiplier;

    return (
      <View style={styles.listHeaderRoot}>
        <View style={[styles.nextCardWrapper, { backgroundColor: cardBg }]}>
          {/* Dekoratif baloncuklar */}
          <View style={styles.nextDecorTop} />
          <View style={styles.nextDecorBottom} />

          <View style={styles.nextCardInner}>
            <View style={styles.nextCardRow}>
              {/* Icon box */}
              <View style={styles.nextIconBox}>
                <Icon
                  type={iconType}
                  name={iconName as any}
                  color={'#FFFFFF'}
                  size={baseIconSize}
                  solid
                />
              </View>

              {/* Metinler */}
              <View style={styles.nextTextWrap}>
                <Text
                  style={[
                    styles.nextLabelText,
                    { fontSize: 14 * fontScaleMultiplier },
                  ]}
                >
                  {countdownTitle}
                </Text>
                <Text
                  style={[
                    styles.nextBigTime,
                    { fontSize: 32 * fontScaleMultiplier },
                  ]}
                >
                  {leftClock}
                </Text>
              </View>
            </View>

            {/* Sağ altta tarih / sync */}
            <View style={styles.nextMeta}>
              {!!seqDateLabel && (
                <View style={styles.metaRow}>
                  {isResyncing && (
                    <ActivityIndicator size="small" color="#fff" />
                  )}
                  <Text
                    style={[
                      styles.metaText,
                      { fontSize: 13 * fontScaleMultiplier },
                    ]}
                    numberOfLines={1}
                  >
                    {seqDateLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  },
);

// ---------------------------------------------------------------------------
// RAMAZAN COUNTDOWN CARD (FlatList footer'ı)
// ---------------------------------------------------------------------------
type RamadanCountdownInfo = {
  iftarTarget: Date;
  sahurTarget: Date;
  maghribToday: Date;
  fajrToday: Date;
};

type RamadanCountdownProps = {
  ramadanInfo: RamadanCountdownInfo | null;
  currentNow: Date;
};

const RamadanCountdownCard: React.FC<RamadanCountdownProps> = memo(
  ({ ramadanInfo, currentNow }) => {
    const { t } = useTranslation();
    const { currentTheme } = useTheme();
    const fontScalePreference = useSelector(
      (state: RootState) =>
        state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
    );
    const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);
    if (!ramadanInfo) return null;

    const { iftarTarget, sahurTarget, maghribToday, fajrToday } = ramadanInfo;

    const FIFTEEN_MIN = 15 * 60;

    // Akşamdan imsağa kadar sahur bilgisi göster, diğer zamanlarda iftar
    const isNightPhase = currentNow >= maghribToday || currentNow < fajrToday;
    const activeTarget = isNightPhase ? sahurTarget : iftarTarget;
    const activeLabel = isNightPhase
      ? t('prayerTime.ramadanSahurCountdown')
      : t('prayerTime.ramadanIftarCountdown');

    const secondsLeft = Math.max(
      0,
      Math.floor((activeTarget.getTime() - currentNow.getTime()) / 1000),
    );
    const countdownClock = fmtClock(secondsLeft);
    const isCritical = secondsLeft > 0 && secondsLeft <= FIFTEEN_MIN;

    // Ramazan temalı renk önerileri:
    // const ramadanIndigo = '#312E81';
    // const ramadanPalm = '#14532D';
    // const ramadanSunset = '#9D174D';
    // const ramadanBase = '#0F766E'; // turkuaz-yeşil ton (Ramazan için çok kullanılır)
    // const ramadanBase = '#4C1D95'; // mor gece tonu
    // const ramadanBase = '#166534'; // koyu yeşil, cami / hilal çağrışımı
    const ramadanBase = currentTheme.ramadanCountdown.base;

    const safeSystemRed = currentTheme.systemRed || '#B91C1C';
    const cardBg = isCritical ? `${safeSystemRed}E6` : `${ramadanBase}F0`;
    const ramadanColors = currentTheme.ramadanCountdown;

    return (
      <View style={styles.ramadanSingleRoot}>
        <View style={[styles.ramadanSingleCard, { backgroundColor: cardBg }]}>
          <View
            style={[
              styles.ramadanIconBadge,
              {
                borderColor: ramadanColors.badgeBorder,
                backgroundColor: ramadanColors.badgeBackground,
              },
            ]}
          >
            <RamadanIcon size={50} color="#fff" opacity={1} />
          </View>
          <View style={styles.ramadanTextWrap}>
            <Text
              style={[
                styles.ramadanActiveText,
                {
                  color: ramadanColors.labelColor,
                  fontSize: 16 * fontScaleMultiplier,
                },
              ]}
            >
              {activeLabel}
            </Text>
          </View>

          <View
            style={[
              styles.ramadanCountdownWrap,
              { backgroundColor: ramadanColors.timerBackground },
            ]}
          >
            <Text
              style={[
                styles.ramadanCountdownText,
                { color: ramadanColors.timerText },
                isCritical && { color: ramadanColors.timerCriticalText },
                { fontSize: 26 * fontScaleMultiplier },
              ]}
            >
              {countdownClock}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

// ----- UI -------------------------------------------------------------------

export default function PrayerTime() {
  const { currentTheme } = useTheme();
  const activeResolved = useSelector(selectActiveResolved);
  const savedLocations = useSelector(selectSavedPlaces);
  const showRamadanCountdownPreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.showRamadanCountdownCard ?? true,
  );
  const prayerNotificationPreferences = useSelector(
    (state: RootState) =>
      state.applicationSettings?.prayerNotificationPreferences,
  );

  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const cachedPrayerSnapshot = useSelector(selectPrayerSnapshot);
  const cachedRamadanSnapshot = useSelector(selectRamadanSnapshot);
  const cachedSeqBaseDate = cachedPrayerSnapshot.sequenceBaseDate
    ? new Date(cachedPrayerSnapshot.sequenceBaseDate)
    : null;

  const [timings, setTimings] = useState<PrayerTimings | null>(
    cachedPrayerSnapshot.timings,
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [leftClock, setLeftClock] = useState('00:00:00');
  const [leftSec, setLeftSec] = useState(0);
  const nextKeyRef = useRef<PrayerTimeKey>('Fajr');
  const currentKeyRef = useRef<PrayerTimeKey>('Fajr');

  const [locationLabel, setLocationLabel] = useState<string>(
    cachedPrayerSnapshot.locationLabel ?? '',
  );
  const [utcLabel, setUtcLabel] = useState<string>(
    cachedPrayerSnapshot.utcLabel ?? getUTCLabel(),
  );
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    cachedPrayerSnapshot.coords,
  );
  const [nowTick, setNowTick] = useState(new Date());
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<
    boolean | null
  >(null);
  const prevLocationPermissionRef = useRef<boolean | null>(null);

  // Senkron durumu: hem ref (timer closure güvenliği) hem state (UI)
  const isResyncingRef = useRef<boolean>(false);
  const [isResyncing, setIsResyncing] = useState(false);

  // Artık string yerine baz alınan tarih state’i
  const [seqBaseDate, setSeqBaseDate] = useState<Date>(
    cachedSeqBaseDate ?? new Date(),
  );

  // Jump/day/TZ izleme
  const seqRef = useRef<ReturnType<typeof buildSequence> | null>(null);
  const seqBaseDayRef = useRef<string>(ymd(cachedSeqBaseDate ?? new Date())); // seq hangi güne ait
  const lastNowRef = useRef<Date>(new Date());
  const lastOffsetRef = useRef<number>(new Date().getTimezoneOffset());
  const lastDayRef = useRef<number>(new Date().getDate());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDeviceCoordsRef = useRef<LatLng | null>(null);
  const appStateRef = useRef<string>(AppState.currentState);
  const comparingLocationRef = useRef(false);
  const deviceDateAlertShownRef = useRef(false);

  const systemDark = useColorScheme() === 'dark';
  const navigation = useNavigation();

  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  const isRamadanWindow = useMemo(() => {
    const hijriToday = convertMiladiDateToHicriDate(nowTick);
    if (hijriToday.month === 9) {
      return true;
    }
    if (hijriToday.month === 8 && hijriToday.dayOfMonth >= 29) {
      // Keep countdown visible on the day before Ramadan begins.
      return true;
    }
    return false;
  }, [nowTick]);

  const shouldShowRamadanCountdown =
    showRamadanCountdownPreference || isRamadanWindow;

  const currentDateKey = useMemo(() => getCurrentDateKey(nowTick), [nowTick]);

  const refreshLocationPermissionStatus = useCallback(async () => {
    try {
      const granted = await hasLocationPermission();
      setLocationPermissionGranted(granted);
    } catch (error) {
      console.warn('Location permission check failed', error);
      setLocationPermissionGranted(false);
    }
  }, []);

  useEffect(() => {
    refreshLocationPermissionStatus();
  }, [refreshLocationPermissionStatus]);

  useFocusEffect(
    useCallback(() => {
      refreshLocationPermissionStatus();
    }, [refreshLocationPermissionStatus]),
  );

  useEffect(() => {
    if (
      locationPermissionGranted === false &&
      savedLocations.length > 0 &&
      activeResolved.type === 'device'
    ) {
      dispatch(setActiveById(savedLocations[0].id));
    }
  }, [activeResolved, dispatch, locationPermissionGranted, savedLocations]);

  useEffect(() => {
    if (
      cachedPrayerSnapshot.timings &&
      cachedPrayerSnapshot.timings !== timings
    ) {
      setTimings(cachedPrayerSnapshot.timings);
    }
    if (
      cachedPrayerSnapshot.locationLabel &&
      cachedPrayerSnapshot.locationLabel !== locationLabel
    ) {
      setLocationLabel(cachedPrayerSnapshot.locationLabel);
    }
    if (
      cachedPrayerSnapshot.utcLabel &&
      cachedPrayerSnapshot.utcLabel !== utcLabel
    ) {
      setUtcLabel(cachedPrayerSnapshot.utcLabel);
    }
    if (cachedPrayerSnapshot.coords) {
      const { lat, lon } = cachedPrayerSnapshot.coords;
      if (!coords || coords.lat !== lat || coords.lon !== lon) {
        setCoords(cachedPrayerSnapshot.coords);
      }
    }
    if (cachedPrayerSnapshot.sequenceBaseDate) {
      const cachedDate = new Date(cachedPrayerSnapshot.sequenceBaseDate);
      if (cachedDate.getTime() !== seqBaseDate.getTime()) {
        setSeqBaseDate(cachedDate);
        seqBaseDayRef.current = ymd(cachedDate);
      }
    }
  }, [
    cachedPrayerSnapshot,
    coords,
    locationLabel,
    seqBaseDate,
    timings,
    utcLabel,
  ]);

  const prayerLabels = useMemo(() => {
    return PRAYER_ORDER.reduce((acc, key) => {
      acc[key] = t(PRAYER_NAME_KEYS[key]);
      return acc;
    }, {} as Record<PrayerTimeKey, string>);
  }, [t]);

  const enabledNotificationKeys = useMemo<PrayerTimeKey[]>(() => {
    if (!prayerNotificationPreferences) {
      return PRAYER_ORDER;
    }
    return PRAYER_ORDER.filter(
      key => prayerNotificationPreferences[key] !== false,
    );
  }, [prayerNotificationPreferences]);

  // --- Date formatter'ı memoize et (ESLint uyarısı çözümü) ------------------
  const dtf = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [dateLocale],
  );

  // Dil veya seqBaseDate değişince etiket türet
  const seqDateLabel = useMemo(() => {
    const s = dtf.format(seqBaseDate);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [dtf, seqBaseDate]);

  // --- LOAD (timestamp'li) --------------------------------------------------
  const load = useCallback(
    async (
      baseDate: Date = new Date(),
      resolvedDeviceCoords?: {
        latitude: number;
        longitude: number;
        label?: string;
      },
    ) => {
      try {
        setLoading(true);
        isResyncingRef.current = true;
        setIsResyncing(true);

        let latitude: number | null = null;
        let longitude: number | null = null;
        let label: string | null = null;

        if ('type' in activeResolved && activeResolved.type === 'device') {
          if (resolvedDeviceCoords) {
            latitude = resolvedDeviceCoords.latitude;
            longitude = resolvedDeviceCoords.longitude;
            label = resolvedDeviceCoords.label ?? null;
          } else {
            const permissionResult = await requestLocationPermission();
            const granted = permissionResult === 'granted';
            setLocationPermissionGranted(granted);
            if (!granted) return;
            const pos = await getCurrentPosition();
            latitude = pos.latitude;
            longitude = pos.longitude;
          }
        } else {
          latitude = activeResolved.latitude;
          longitude = activeResolved.longitude;
          label = activeResolved.label;
        }

        if (!label && latitude != null && longitude != null) {
          try {
            label = await reverseGeocode(latitude, longitude);
          } catch {
            label = t('prayerTime.locationNotFound');
          }
        }

        if (latitude != null && longitude != null) {
          const coordsPayload = { lat: latitude, lon: longitude };
          setCoords(coordsPayload);

          // Cihazın O ANKİ tarihine göre vakitler
          const data = await fetchPrayerTimesByCoords(
            latitude,
            longitude,
            baseDate,
          );
          setTimings(data);

          // UTC etiketi de o tarihe göre
          const tz = getTimeZoneByCoords(latitude, longitude);
          const label2 = getUtcLabelFromTimeZone(tz, baseDate);
          setUtcLabel(label2);

          // seq'in gününü not et ve baz tarihi yaz
          seqBaseDayRef.current = ymd(baseDate);
          setSeqBaseDate(baseDate);
          const sequenceBaseDate = baseDate.toISOString();

          if ('type' in activeResolved && activeResolved.type === 'device') {
            lastDeviceCoordsRef.current = { lat: latitude, lon: longitude };
          } else {
            lastDeviceCoordsRef.current = null;
          }

          const ramadanTimes = getIftarAndSahurTargets(data, baseDate);
          dispatch(
            savePrayerSnapshot({
              timings: data,
              locationLabel: label ?? null,
              utcLabel: label2 ?? null,
              coords: coordsPayload,
              sequenceBaseDate,
            }),
          );
          dispatch(
            saveRamadanSnapshot({
              iftarTarget: ramadanTimes.iftarTarget.toISOString(),
              sahurTarget: ramadanTimes.sahurTarget.toISOString(),
              maghribToday: ramadanTimes.maghribToday.toISOString(),
              fajrToday: ramadanTimes.fajrToday.toISOString(),
            }),
          );
        }
        if (label) setLocationLabel(label);
        deviceDateAlertShownRef.current = false;
      } catch (error: any) {
        console.warn('[prayer-time] load failed', error);
        const isDeviceDateError =
          error?.prayerTimesCode === 'NETWORK_OR_DEVICE_DATE' ||
          error?.message === 'PRAYER_TIMES_NETWORK_ERROR' ||
          error?.message === 'Network request failed';
        if (isDeviceDateError) {
          if (!deviceDateAlertShownRef.current) {
            deviceDateAlertShownRef.current = true;
            Alert.alert(
              t('prayerTimeApi.deviceDateInvalidTitle'),
              t('prayerTimeApi.deviceDateInvalidMessage'),
              [
                {
                  text: t('prayerTimeApi.deviceDateInvalidButton'),
                  onPress: () => {
                    deviceDateAlertShownRef.current = false;
                  },
                },
              ],
              {
                cancelable: true,
                onDismiss: () => {
                  deviceDateAlertShownRef.current = false;
                },
              },
            );
          }
        } else {
          Alert.alert(
            t('prayerTimeApi.fetchErrorTitle', {
              defaultValue: 'Vakit bilgisi alınamadı',
            }),
            t('errors.prayerTimesFetchFailed'),
          );
        }
        return;
      } finally {
        setLoading(false);
        isResyncingRef.current = false;
        setIsResyncing(false);
      }
    },
    [activeResolved, dispatch, t],
  );

  useEffect(() => {
    const prev = prevLocationPermissionRef.current;
    prevLocationPermissionRef.current = locationPermissionGranted;
    if (
      prev === false &&
      locationPermissionGranted === true &&
      activeResolved.type === 'device'
    ) {
      load(new Date());
    }
  }, [activeResolved, locationPermissionGranted, load]);

  // timings geldiğinde sequence ve ilk hesap
  useEffect(() => {
    if (!timings) return;
    const now = new Date();
    seqRef.current = buildSequence(timings, prayerLabels);

    const info = computeNext(seqRef.current, now);
    nextKeyRef.current = info.next.key;
    currentKeyRef.current = info.prev.key;

    const clamped = Math.max(0, Math.min(info.leftSec, MAX_SPAN_SEC));
    setLeftClock(fmtClock(clamped));
    setLeftSec(clamped);

    lastNowRef.current = now;
    lastDayRef.current = now.getDate();
    lastOffsetRef.current = now.getTimezoneOffset();

    if (!seqBaseDayRef.current) {
      seqBaseDayRef.current = ymd(now);
    }
  }, [timings, prayerLabels]);

  useEffect(() => {
    if (!seqRef.current || !timings) {
      return;
    }

    prayerNotificationManager.syncDailyNotifications({
      sequence: seqRef.current,
      buildContent: entry => ({
        title: t('notifications.prayerReminderTitle'),
        message: t('notifications.prayerReminderBody', {
          label: entry.label,
        }),
      }),
      enabledKeys: enabledNotificationKeys,
    });
  }, [timings, currentDateKey, t, enabledNotificationKeys]);

  // ilk yükleme
  useEffect(() => {
    load();
  }, [load]);

  const checkDeviceLocationChange = useCallback(async () => {
    if (
      comparingLocationRef.current ||
      !('type' in activeResolved && activeResolved.type === 'device')
    ) {
      return;
    }

    comparingLocationRef.current = true;
    try {
      const permissionResult = await requestLocationPermission();
      if (permissionResult !== 'granted') return;
      const pos = await getCurrentPosition();

      const currentCoords: LatLng = {
        lat: pos.latitude,
        lon: pos.longitude,
      };
      const previous = lastDeviceCoordsRef.current;
      if (!previous) {
        lastDeviceCoordsRef.current = currentCoords;
        return;
      }

      const movedKm = haversineDistanceKm(previous, currentCoords);
      if (movedKm > LOCATION_CHANGE_THRESHOLD_KM) {
        await load(new Date(), {
          latitude: currentCoords.lat,
          longitude: currentCoords.lon,
        });
      } else {
        lastDeviceCoordsRef.current = currentCoords;
      }
    } catch (err) {
      console.warn('Device location check failed', err);
    } finally {
      comparingLocationRef.current = false;
    }
  }, [activeResolved, load]);

  // Pull-to-refresh için handler
  const handleRefresh = useCallback(async () => {
    if (isResyncingRef.current) {
      // Zaten reload çalışıyorsa ikinci isteğe gerek yok
      return;
    }
    deviceDateAlertShownRef.current = false;
    setRefreshing(true);
    try {
      await load(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  // Timer'ı kur/yeniden kur
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const softRecalc = (now = new Date()) => {
      // Reload sırasında veya seq günü eşleşmiyorsa dokunma
      if (!seqRef.current || seqBaseDayRef.current !== ymd(now)) {
        return;
      }
      const info = computeNext(seqRef.current, now);
      nextKeyRef.current = info.next.key;
      currentKeyRef.current = info.prev.key;

      const clamped = Math.max(0, Math.min(info.leftSec, MAX_SPAN_SEC));
      setLeftClock(fmtClock(clamped));
      setLeftSec(clamped);
    };

    const tick = () => {
      const now = new Date();
      setNowTick(now);
      const delta = now.getTime() - lastNowRef.current.getTime();

      const jumped =
        Math.abs(delta - 1000) > 2000 ||
        now.getTime() < lastNowRef.current.getTime();

      const dayChanged = now.getDate() !== lastDayRef.current;
      const tzChanged = now.getTimezoneOffset() !== lastOffsetRef.current;

      if (dayChanged || tzChanged) {
        // Güne veya timezone'a göre gerçekten yeniden senkronize et
        setUtcLabel(getUTCLabel());
        load(now);
        lastDayRef.current = now.getDate();
        lastOffsetRef.current = now.getTimezoneOffset();
      } else {
        // Diğer tüm durumlarda (örn. uygulamadan geri dönme) sadece yerel hesaplamayı tazele
        softRecalc(now);
      }

      if (jumped) {
        // Uzun beklemelerden sonra interval drift edebiliyor, sadece timer'ı sıfırla
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(tick, 1000);
      }

      lastNowRef.current = now;
    };

    // ilk tetik
    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, [load]);

  // Timer yaşam döngüsü – SADECE EKRAN FOKUSTA İKEN
  useFocusEffect(
    useCallback(() => {
      // timings henüz gelmediyse bile timer başlatılır, softRecalc sıfır çalışır;
      // timings gelince effect tekrar çalışıp timer'ı tazeler.
      refreshLocationPermissionStatus();
      startTimer();

      const appSub = AppState.addEventListener('change', s => {
        const prevState = appStateRef.current;
        appStateRef.current = s;
        if (s === 'active') {
          // Uygulama yeniden aktive olduğunda, eğer bu ekran odaktaysa timer'ı tazele
          startTimer();
          refreshLocationPermissionStatus();
          if (prevState === 'background' || prevState === 'inactive') {
            checkDeviceLocationChange();
          }
        } else if (s === 'background') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      });

      return () => {
        // EKRANDAN ÇIKARKEN / TAB DEĞİŞİRKEN her şeyi temizle
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        appSub.remove();
      };
    }, [
      checkDeviceLocationChange,
      refreshLocationPermissionStatus,
      startTimer,
    ]),
  );

  // küçük kart listesi
  const renderSmallCard = useCallback(
    ({ item, index }: ListRenderItemInfo<SmallCard>) => (
      <PrayerTimeSmallCard item={item} index={index} />
    ),
    [],
  );

  const smallCards: SmallCard[] = useMemo(() => {
    if (!timings || !seqRef.current) return [];
    const cur = currentKeyRef.current;
    return seqRef.current.map(x => ({
      key: x.key,
      label: x.label,
      time: x.time,
      isCurrent: x.key === cur,
      miniLeft: x.key === cur ? leftClock : undefined,
      notif: x.key === 'Fajr' || x.key === 'Maghrib',
    }));
  }, [timings, leftClock]);

  const ramadanCountdownInfo = useMemo(() => {
    if (timings) {
      const { iftarTarget, sahurTarget, maghribToday, fajrToday } =
        getIftarAndSahurTargets(timings, nowTick);
      return {
        iftarTarget,
        sahurTarget,
        maghribToday,
        fajrToday,
      };
    }
    if (
      cachedRamadanSnapshot.iftarTarget &&
      cachedRamadanSnapshot.sahurTarget &&
      cachedRamadanSnapshot.maghribToday &&
      cachedRamadanSnapshot.fajrToday
    ) {
      return {
        iftarTarget: new Date(cachedRamadanSnapshot.iftarTarget),
        sahurTarget: new Date(cachedRamadanSnapshot.sahurTarget),
        maghribToday: new Date(cachedRamadanSnapshot.maghribToday),
        fajrToday: new Date(cachedRamadanSnapshot.fajrToday),
      };
    }
    return null;
  }, [cachedRamadanSnapshot, nowTick, timings]);

  const listFooter = useMemo(
    () => (
      <View style={styles.footerStack}>
        {shouldShowRamadanCountdown ? (
          <RamadanCountdownCard
            ramadanInfo={ramadanCountdownInfo}
            currentNow={nowTick}
          />
        ) : null}
        <QuranAyahCard currentDateKey={currentDateKey} />
        <AsmaulHusnaCard currentDateKey={currentDateKey} />
        <HadithCard currentDateKey={currentDateKey} />
      </View>
    ),
    [shouldShowRamadanCountdown, ramadanCountdownInfo, nowTick, currentDateKey],
  );

  const shouldShowLocationPermissionCard =
    locationPermissionGranted === false && savedLocations.length === 0;

  // ------- render -----------------------------------------------------------
  if (shouldShowLocationPermissionCard) {
    return (
      <SafeAreaWithStatusBar>
        <BottomTabScreenViewContainer>
          <View style={styles.permissionCardScreen}>
            <View
              style={[
                styles.permissionCard,
                { backgroundColor: currentTheme.cardViewBackgroundColor },
              ]}
            >
              <View
                style={[
                  styles.permissionIconCircle,
                  { backgroundColor: `${currentTheme.primary}1A` },
                ]}
              >
                <Icon
                  type={Icons.MaterialDesignIcons}
                  name="map-marker-off"
                  size={28}
                  color={currentTheme.primary}
                />
              </View>
              <Text
                style={[
                  styles.permissionTitle,
                  { color: currentTheme.textColor },
                ]}
              >
                {t('prayerTime.permissionCardTitle')}
              </Text>
              <Text
                style={[
                  styles.permissionDescription,
                  {
                    color:
                      currentTheme.placeholderTextColor || 'rgba(15,23,42,0.7)',
                  },
                ]}
              >
                {t('prayerTime.permissionCardDescription')}
              </Text>
              <Pressable
                style={[
                  styles.permissionButton,
                  { backgroundColor: currentTheme.primary },
                ]}
                onPress={() =>
                  navigation.navigate(
                    PrayerTimeScreens.LocationSelector as never,
                  )
                }
              >
                <Text style={styles.permissionButtonText}>
                  {t('prayerTime.permissionCardButton')}
                </Text>
              </Pressable>
            </View>
          </View>
        </BottomTabScreenViewContainer>
      </SafeAreaWithStatusBar>
    );
  }

  if (loading && !timings) {
    return (
      <SafeAreaWithStatusBar>
        <BottomTabScreenViewContainer
          showSkeleton
          skeletonContent={<PrayerTimeSkeleton />}
          children={undefined}
        />
      </SafeAreaWithStatusBar>
    );
  }

  // Büyük kart
  const currentLabel = prayerLabels[currentKeyRef.current] ?? '';
  const currentIcon = PRAYER_TIME_ICONS[currentKeyRef.current] as any;
  const isCritical = leftSec <= 45 * 60;
  const criticalRed = `${currentTheme.systemRed || '#FF3B30'}E6`;
  const cardBg = isCritical ? criticalRed : `${currentTheme.primary}CC`;

  const countdownTitle = t('prayerTime.nextPrayerCountdown', {
    label: currentLabel,
  });
  return (
    <SafeAreaWithStatusBar>
      <BottomTabScreenViewContainer>
        <View style={styles.screenInner}>
          <FlatList
            data={smallCards}
            numColumns={2}
            keyExtractor={i => i.key}
            renderItem={renderSmallCard}
            ListHeaderComponent={
              <>
                <ActionCardGroup
                  label={locationLabel}
                  utc={utcLabel}
                  loading={loading || isResyncing}
                  isDark={systemDark}
                  theme={{
                    primary: currentTheme.primary,
                    textColor: currentTheme.textColor,
                    cardViewBackgroundColor:
                      currentTheme.cardViewBackgroundColor,
                  }}
                  onOpenLocationSelector={() =>
                    navigation.navigate(
                      PrayerTimeScreens.LocationSelector as never,
                    )
                  }
                  onPickDate={() => {
                    if (!coords) return;
                    navigation.navigate(
                      PrayerTimeScreens.MontlyCalendar as never,
                    );
                  }}
                  onOpenImsakiye={() => {
                    if (!coords) return;
                    navigation.navigate(PrayerTimeScreens.Imsakiye as never);
                  }}
                  onOpenQibla={() => {
                    if (!coords) return;
                    navigation.navigate(PrayerTimeScreens.Qibla as never);
                  }}
                />
                <PrayerTimeHeader
                  cardBg={cardBg}
                  iconType={currentIcon.type}
                  iconName={currentIcon.name as any}
                  countdownTitle={countdownTitle}
                  leftClock={leftClock}
                  isResyncing={isResyncing}
                  seqDateLabel={seqDateLabel}
                />
              </>
            }
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            initialNumToRender={6}
            windowSize={7}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                // Android için spinner rengi
                colors={[currentTheme.primary]}
                // iOS için spinner rengi
                tintColor={currentTheme.primary}
                // İstersen arka plan da tema ile uyumlu olsun:
                progressBackgroundColor={currentTheme.cardViewBackgroundColor}
              />
            }
          />
        </View>
      </BottomTabScreenViewContainer>
    </SafeAreaWithStatusBar>
  );
}

// ----- styles ---------------------------------------------------------------
const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  headerTop: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 10,
  },
  nextIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  nextHint: { color: 'rgba(255,255,255,0.95)', fontSize: 16, marginTop: 2 },
  dateText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  syncRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
  },
  nextCard: {
    marginTop: 14,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  screenInner: {
    flex: 1,
  },
  screenHeader: {
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  footerStack: {
    marginTop: 12,
    marginBottom: 32,
  },
  columnWrapper: { justifyContent: 'space-between' },
  permissionCardScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  permissionCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'flex-start',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  permissionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  permissionDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  permissionButton: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  listHeaderRoot: {
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  testNotificationButton: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testNotificationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nextCardWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  nextCardInner: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: 'transparent',
  },
  nextDecorTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  nextDecorBottom: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 70,
    height: 70,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  nextIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  nextTextWrap: {
    flex: 1,
  },
  nextLabelText: {
    color: 'rgba(240,253,250,0.95)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  nextBigTime: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  nextMeta: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  metaText: {
    color: 'rgba(240,253,250,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // ---- Ramadan card styles -------------------------------------------------
  ramadanSingleRoot: {
    marginTop: 16,
    marginBottom: 12,
  },
  ramadanSingleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  ramadanIconBadge: {
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    padding: 5,
  },
  ramadanTextWrap: {
    flex: 1,
  },
  ramadanActiveText: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
  },
  ramadanCountdownWrap: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ramadanCountdownText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
