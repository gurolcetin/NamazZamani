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
  Linking,
  ListRenderItemInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import {
  PrayerTimings,
  fetchPrayerTimesByCoords,
  fetchPrayerTimeMethods,
  findClosestPrayerMethod,
  tuneSettingsToArray,
} from './api';
import { fetchMonthlyPrayerTimesByCoords } from './MontlyCalendar/api';
import {
  requestLocationPermission,
  getCurrentPosition,
  hasLocationPermission,
  LocationServicesDisabledError,
} from './permission';
import {
  BottomTabScreenViewContainer,
  ContextualHint,
  Icon,
  Icons,
  PRAYER_TIME_ICONS,
  PrayerTimeSmallCard,
  SafeAreaWithStatusBar,
} from '../../../libs/components';
import { useTheme } from '../../../libs/core/providers';
import {
  reverseGeocode,
  reverseGeocodeCountryCode,
  getUTCLabel,
} from './reverse-geocode';
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
  ReligiousDaysSliderCard,
} from './info-cards';
import PrayerTimeSkeleton from './prayer-time-skeleton';
import {
  PrayerTimeKey,
  PrayerTimeMethodOption,
  PrayerTimeTuneSettings,
  PrayerTuneKey,
  SmallCard,
  DEFAULT_PRAYER_TIME_TUNE,
} from '../../../libs/common/types';
import {
  LanguageLocaleKeys,
  LanguagePrefix,
} from '../../../libs/common/constants';
import { useTranslation } from 'react-i18next';
import RamadanIcon from '../../../libs/components/svg/icons/ramadan-icon';
import { convertMiladiDateToHicriDate } from '../../../libs/core/helpers/hicriDate.helper';
import { updatePrayerWidgetSnapshot } from '../../services/prayerWidgetService';
import type { RootState } from '../../../libs/redux/store';
import { prayerNotificationManager } from '../../../libs/core/helpers/prayer-notification';
import { FontScaleOption } from '../../../libs/common/enums';
import {
  savePrayerSnapshot,
  saveRamadanSnapshot,
  selectPrayerSnapshot,
  selectRamadanSnapshot,
} from '../../../libs/redux/reducers/prayerTimesCache';
import {
  updateAppConfig,
  setPrayerTimeMethodOptions,
  updatePrayerTimeMethod,
  DEVICE_METHOD_KEY,
  setPrayerTimeTuneValues,
} from '../../../libs/redux/reducers/ApplicationSettings';
import { isCloseToBottom } from '../../../libs/core/utils';

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

const LOCATION_CHANGE_THRESHOLD_KM = 7; // şehir değişimi için yaklaşık eşik
const PRAYER_NAME_KEYS: Record<PrayerTimeKey, string> = {
  Fajr: 'prayerNames.Fajr',
  Sunrise: 'prayerNames.Sunrise',
  Dhuhr: 'prayerNames.Dhuhr',
  Asr: 'prayerNames.Asr',
  Maghrib: 'prayerNames.Maghrib',
  Isha: 'prayerNames.Isha',
};
const METHODS_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün
const DEFAULT_METHOD_ID = 13;
const LOCATION_HINT_FREQUENCY_MS = 7 * 24 * 60 * 60 * 1000;
const RAMADAN_HINT_FREQUENCY_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_HINT_DURATION_MS = 9000;
const TUNE_MIN = -120;
const TUNE_MAX = 120;
const TUNE_STEP = 1;
const TUNE_COMMIT_DEBOUNCE_MS = 1000;
const TUNE_CONTROL_ITEMS: Array<{
  key: PrayerTuneKey;
  labelKey: string;
}> = [
  { key: 'fajr', labelKey: 'locationSelector.tuneImsak' },
  { key: 'sunrise', labelKey: 'locationSelector.tuneSunrise' },
  { key: 'dhuhr', labelKey: 'locationSelector.tuneDhuhr' },
  { key: 'asr', labelKey: 'locationSelector.tuneAsr' },
  { key: 'maghrib', labelKey: 'locationSelector.tuneMaghrib' },
  { key: 'isha', labelKey: 'locationSelector.tuneIsha' },
];

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
  baseDate: Date = new Date(),
) {
  return PRAYER_ORDER.map(k => ({
    key: k,
    label: labels[k] ?? k,
    time: t[k],
    date: toTodayDate(t[k], baseDate),
  }));
}

type NotificationSequenceEntry = {
  key: PrayerTimeKey;
  label: string;
  date: Date;
};

function buildNotificationSequenceRange(
  start: Date,
  totalDays: number,
  month1: PrayerTimings[],
  month2: PrayerTimings[] | null,
  labels: Record<PrayerTimeKey, string>,
): NotificationSequenceEntry[] {
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1;

  const items: NotificationSequenceEntry[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const arr = y === startYear && m === startMonth ? month1 : month2 ?? month1;
    const timings = arr[day - 1];
    if (!timings) continue;
    PRAYER_ORDER.forEach(key => {
      items.push({
        key,
        label: labels[key] ?? key,
        date: toTodayDate(timings[key], d),
      });
    });
  }

  return items;
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

function isBetween(now: Date, start: Date, end: Date) {
  const nowTs = now.getTime();
  return nowTs >= start.getTime() && nowTs < end.getTime();
}

function shiftSeconds(base: Date, seconds: number) {
  return new Date(base.getTime() + seconds * 1000);
}

function isKerahatTime(
  seq: ReturnType<typeof buildSequence>,
  now = new Date(),
) {
  const byKey = new Map(seq.map(item => [item.key, item.date] as const));
  const sunrise = byKey.get('Sunrise');
  const dhuhr = byKey.get('Dhuhr');
  const maghrib = byKey.get('Maghrib');

  if (!sunrise || !dhuhr || !maghrib) {
    return false;
  }

  const FORTY_FIVE_MIN_SEC = 45 * 60;
  const sunriseForbiddenEnd = shiftSeconds(sunrise, FORTY_FIVE_MIN_SEC);
  const noonForbiddenStart = shiftSeconds(dhuhr, -FORTY_FIVE_MIN_SEC);
  const sunsetForbiddenStart = shiftSeconds(maghrib, -FORTY_FIVE_MIN_SEC);

  // Kerahat pencereleri:
  // 1) Güneşten sonra 45 dk
  // 2) Öğleden önce 45 dk
  // 3) Akşamdan önce 45 dk
  return (
    isBetween(now, sunrise, sunriseForbiddenEnd) ||
    isBetween(now, noonForbiddenStart, dhuhr) ||
    isBetween(now, sunsetForbiddenStart, maghrib)
  );
}

// ---- Flicker guard helpers -------------------------------------------------
function ymd(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0'); // getMonth 0-based
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const getCurrentDateKey = (d: Date) => ymd(d);
const MAX_SPAN_SEC = 26 * 3600; // güvenli üst sınır (clamp)
const NOTIFICATION_WINDOW_DAYS = 7;

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
  showKerahatBar: boolean;
  kerahatLabel: string;
  kerahatTextColor: string;
  leftClock: string;
  isResyncing: boolean;
  seqDateLabel: string;
  hijriDateLabel: string;
};

const PrayerTimeHeader: React.FC<HeaderProps> = memo(
  ({
    cardBg,
    iconType,
    iconName,
    countdownTitle,
    showKerahatBar,
    kerahatLabel,
    kerahatTextColor,
    leftClock,
    isResyncing,
    seqDateLabel,
    hijriDateLabel,
  }) => {
    const fontScalePreference = useSelector(
      (state: RootState) =>
        state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
    );
    const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);
    const baseIconSize = 26 * fontScaleMultiplier;

    return (
      <View style={styles.listHeaderRoot}>
        <View
          style={[
            styles.nextCardWrapper,
            { backgroundColor: cardBg },
            showKerahatBar && styles.nextCardWrapperWithKerahat,
          ]}
        >
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
                    { fontSize: 18 * fontScaleMultiplier },
                  ]}
                >
                  {countdownTitle}
                </Text>
                <Text
                  style={[
                    styles.nextBigTime,
                    { fontSize: 50 * fontScaleMultiplier },
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
                      { fontSize: 14 * fontScaleMultiplier },
                    ]}
                    numberOfLines={1}
                  >
                    {seqDateLabel}
                  </Text>
                </View>
              )}
              {!!hijriDateLabel && (
                <Text
                  style={[
                    styles.metaText,
                    styles.hijriText,
                    { fontSize: 14 * fontScaleMultiplier },
                  ]}
                  numberOfLines={1}
                >
                  {hijriDateLabel}
                </Text>
              )}
            </View>
          </View>
        </View>

        {showKerahatBar && (
          <View style={styles.nextKerahatBar}>
            <Text
              style={[
                styles.nextKerahatText,
                {
                  color: kerahatTextColor,
                  fontSize: 14 * fontScaleMultiplier,
                },
              ]}
            >
              {kerahatLabel}
            </Text>
          </View>
        )}
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
    const labelLineHeight = 20 * fontScaleMultiplier;

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
          <View style={styles.ramadanContentColumn}>
            <View style={styles.ramadanTextWrap}>
              <Text
                style={[
                  styles.ramadanActiveText,
                  {
                    color: ramadanColors.labelColor,
                    fontSize: 16 * fontScaleMultiplier,
                    lineHeight: labelLineHeight,
                    minHeight: labelLineHeight,
                  },
                ]}
                numberOfLines={2}
              >
                {activeLabel}
              </Text>
            </View>

            <View style={[styles.ramadanCountdownWrap]}>
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
  const showAsmaulHusnaCard = useSelector(
    (state: RootState) =>
      state.applicationSettings?.showAsmaulHusnaCard ?? true,
  );
  const showHadithCard = useSelector(
    (state: RootState) => state.applicationSettings?.showHadithCard ?? true,
  );
  const showQuranAyahCard = useSelector(
    (state: RootState) => state.applicationSettings?.showQuranAyahCard ?? true,
  );
  const showReligiousDaysSlider = useSelector(
    (state: RootState) =>
      state.applicationSettings?.showReligiousDaysSlider ?? true,
  );
  const {
    prayerTimeMethod = DEFAULT_METHOD_ID,
    prayerTimeMethods = [],
    prayerTimeMethodsFetchedAt = null,
    prayerTimeMethodManuallySet = false,
    prayerTimeMethodPreferences = {},
    prayerTimeTune = DEFAULT_PRAYER_TIME_TUNE,
  } = useSelector((state: RootState) => state.applicationSettings ?? {});
  const effectiveTuneOffsets = useMemo(
    () => tuneSettingsToArray(prayerTimeTune),
    [prayerTimeTune],
  );
  const effectiveTuneOffsetsRef = useRef(effectiveTuneOffsets);
  useEffect(() => {
    effectiveTuneOffsetsRef.current = effectiveTuneOffsets;
  }, [effectiveTuneOffsets]);
  const methodPreferencesRef = useRef(prayerTimeMethodPreferences);
  useEffect(() => {
    methodPreferencesRef.current = prayerTimeMethodPreferences;
  }, [prayerTimeMethodPreferences]);
  const legacyMethodRef = useRef(prayerTimeMethod);
  useEffect(() => {
    legacyMethodRef.current = prayerTimeMethod;
  }, [prayerTimeMethod]);
  const legacyManualRef = useRef(prayerTimeMethodManuallySet);
  useEffect(() => {
    legacyManualRef.current = prayerTimeMethodManuallySet;
  }, [prayerTimeMethodManuallySet]);
  const getMethodPreferenceForKey = useCallback((key: string) => {
    const prefs = methodPreferencesRef.current ?? {};
    if (prefs[key]) {
      return prefs[key];
    }
    if (key === DEVICE_METHOD_KEY) {
      return {
        methodId: legacyMethodRef.current ?? DEFAULT_METHOD_ID,
        manuallySet: legacyManualRef.current ?? false,
      };
    }
    return undefined;
  }, []);

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
  const methodKey =
    activeResolved.type === 'device' ? DEVICE_METHOD_KEY : activeResolved.id;
  const activeMethodPref =
    prayerTimeMethodPreferences?.[methodKey] ??
    (methodKey === DEVICE_METHOD_KEY
      ? {
          methodId: prayerTimeMethod,
          manuallySet: prayerTimeMethodManuallySet,
        }
      : undefined);
  const activeMethodId = activeMethodPref?.methodId ?? DEFAULT_METHOD_ID;
  const activeMethodManuallySet = activeMethodPref?.manuallySet ?? false;
  const methodOptions: PrayerTimeMethodOption[] = useMemo(
    () => (Array.isArray(prayerTimeMethods) ? prayerTimeMethods : []),
    [prayerTimeMethods],
  );
  const methodOptionsAvailable = methodOptions.length > 0;
  const methodNameLookup = useMemo(() => {
    const map = new Map<number, string>();
    methodOptions.forEach(option => {
      map.set(option.id, option.name);
    });
    return map;
  }, [methodOptions]);
  const formatMethodName = useCallback(
    (name: string) =>
      name.replace(
        /\(experimental\)/gi,
        `(${t('locationSelector.methodExperimentalTag')})`,
      ),
    [t],
  );
  const activeMethodInfo = useMemo(() => {
    const rawMethodName =
      methodNameLookup.get(activeMethodId) ??
      t('locationSelector.methodUnknown');
    return {
      methodName: formatMethodName(rawMethodName),
      pref: {
        methodId: activeMethodId,
        manuallySet: activeMethodManuallySet,
      },
    };
  }, [
    activeMethodId,
    activeMethodManuallySet,
    formatMethodName,
    methodNameLookup,
    t,
  ]);

  const [leftClock, setLeftClock] = useState('00:00:00');
  const [, setLeftSec] = useState(0);
  const nextKeyRef = useRef<PrayerTimeKey>('Fajr');
  const currentKeyRef = useRef<PrayerTimeKey>('Fajr');

  const [locationLabel, setLocationLabel] = useState<string>(
    cachedPrayerSnapshot.locationLabel ?? '',
  );
  const [utcLabel, setUtcLabel] = useState<string>(
    cachedPrayerSnapshot.utcLabel ?? getUTCLabel(),
  );
  const [methodModalVisible, setMethodModalVisible] = useState(false);
  const [tuneModalVisible, setTuneModalVisible] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    cachedPrayerSnapshot.coords,
  );
  const [nowTick, setNowTick] = useState(new Date());
  const [tuneDraft, setTuneDraft] =
    useState<PrayerTimeTuneSettings>(prayerTimeTune);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<
    boolean | null
  >(null);
  const prevLocationPermissionRef = useRef<boolean | null>(null);
  const [locationServicesDisabled, setLocationServicesDisabled] =
    useState(false);
  const locationServicesDisabledRef = useRef(false);

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
  const tuneCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTuneUpdatesRef = useRef<Partial<Record<PrayerTuneKey, number>>>(
    {},
  );
  const prayerTimeTuneRef = useRef(prayerTimeTune);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDeviceCoordsRef = useRef<LatLng | null>(null);
  const appStateRef = useRef<string>(AppState.currentState);
  const comparingLocationRef = useRef(false);
  const deviceDateAlertShownRef = useRef(false);
  const skipNextMethodReloadRef = useRef<Record<string, boolean>>({});
  const lastMethodStateRef = useRef<
    Record<string, { method: number; manual: boolean }>
  >({
    [DEVICE_METHOD_KEY]: {
      method: prayerTimeMethod,
      manual: prayerTimeMethodManuallySet,
    },
  });

  const navigation = useNavigation();

  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  const [isRamadanWindow, setIsRamadanWindow] = useState(false);

  useEffect(() => {
    let mounted = true;
    convertMiladiDateToHicriDate(nowTick)
      .then(hijriToday => {
        if (!mounted) {
          return;
        }
        if (hijriToday.month === 9) {
          setIsRamadanWindow(true);
        } else if (hijriToday.month === 8 && hijriToday.dayOfMonth >= 29) {
          // Keep countdown visible on the day before Ramadan begins.
          setIsRamadanWindow(true);
        } else {
          setIsRamadanWindow(false);
        }
      })
      .catch(err => {
        console.warn('Hijri date fetch failed (isRamadanWindow)', err);
      });
    return () => {
      mounted = false;
    };
    // nowTick changes every minute; cached responses return immediately from AsyncStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick.toDateString()]);

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

  const ensurePrayerMethods = useCallback(async () => {
    const cachedList = Array.isArray(prayerTimeMethods)
      ? prayerTimeMethods
      : [];
    const fetchedAtMs = prayerTimeMethodsFetchedAt
      ? new Date(prayerTimeMethodsFetchedAt).getTime()
      : 0;
    const isFresh =
      cachedList.length > 0 &&
      fetchedAtMs > 0 &&
      Date.now() - fetchedAtMs < METHODS_CACHE_TTL_MS;
    if (isFresh) {
      return cachedList;
    }

    try {
      const methods = await fetchPrayerTimeMethods();
      dispatch(
        setPrayerTimeMethodOptions({
          methods,
          fetchedAt: new Date().toISOString(),
        }),
      );
      return methods;
    } catch {
      console.warn('[prayer-time] Using cached methods due to fetch failure');
      return cachedList;
    }
  }, [dispatch, prayerTimeMethods, prayerTimeMethodsFetchedAt]);
  const ensurePrayerMethodsRef = useRef(ensurePrayerMethods);
  useEffect(() => {
    ensurePrayerMethodsRef.current = ensurePrayerMethods;
  }, [ensurePrayerMethods]);

  useEffect(() => {
    locationServicesDisabledRef.current = locationServicesDisabled;
  }, [locationServicesDisabled]);

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

  const widgetTheme = useMemo(
    () => ({
      primary: currentTheme.primary,
      cardBackground: currentTheme.cardViewBackgroundColor,
      textColor: currentTheme.textColor,
      mutedTextColor: currentTheme.placeholderTextColor || currentTheme.gray,
      borderColor: currentTheme.cardViewBorderColor,
    }),
    [
      currentTheme.cardViewBackgroundColor,
      currentTheme.cardViewBorderColor,
      currentTheme.gray,
      currentTheme.placeholderTextColor,
      currentTheme.primary,
      currentTheme.textColor,
    ],
  );

  useEffect(() => {
    if (!timings) {
      return;
    }

    updatePrayerWidgetSnapshot({
      timings,
      locationLabel: locationLabel || null,
      utcLabel: utcLabel || null,
      coords,
      sequenceBaseDate: seqBaseDate.toISOString(),
      labels: prayerLabels,
      theme: widgetTheme,
    });
  }, [
    coords,
    locationLabel,
    prayerLabels,
    seqBaseDate,
    timings,
    utcLabel,
    widgetTheme,
  ]);

  const advancedNotifications = useSelector(
    (state: RootState) => state.advancedNotifications,
  );

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

  const [hijriDateLabel, setHijriDateLabel] = useState('');

  useEffect(() => {
    let mounted = true;
    convertMiladiDateToHicriDate(seqBaseDate)
      .then(h => {
        if (mounted) {
          setHijriDateLabel(`${h.dayOfMonth} ${h.monthText} ${h.year}`);
        }
      })
      .catch(err => {
        console.warn('Hijri date fetch failed (hijriDateLabel)', err);
        if (mounted) {
          setHijriDateLabel('');
        }
      });
    return () => {
      mounted = false;
    };
  }, [seqBaseDate]);

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
        const locationMethodKey =
          activeResolved.type === 'device'
            ? DEVICE_METHOD_KEY
            : activeResolved.id;
        const methodPref = getMethodPreferenceForKey(locationMethodKey);
        let methodId = methodPref?.methodId ?? DEFAULT_METHOD_ID;
        let locationMethodManuallySet = methodPref?.manuallySet ?? false;

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

        if (latitude != null && longitude != null) {
          // reverseGeocode'u her zaman çağır: hem label yoksa doldurur hem de
          // country_code'u cache'e yazar. Böylece aşağıdaki reverseGeocodeCountryCode
          // çağrısı her koşulda cache hit'ten okur — ekstra API token harcanmaz.
          try {
            const geocoded = await reverseGeocode(latitude, longitude);
            if (!label) {
              label = geocoded;
            }
          } catch {
            if (!label) {
              label = t('prayerTime.locationNotFound');
            }
          }
        }

        if (latitude != null && longitude != null) {
          try {
            const fetcher = ensurePrayerMethodsRef.current;
            const methods = fetcher ? await fetcher() : [];
            if (methods.length > 0 && !locationMethodManuallySet) {
              const countryCode = await reverseGeocodeCountryCode(
                latitude,
                longitude,
              ).catch(() => null);
              console.log('countryCode for method selection:', countryCode);
              const closest = findClosestPrayerMethod(
                methods,
                latitude,
                longitude,
                countryCode,
              );
              if (closest?.id && closest.id !== methodId) {
                methodId = closest.id;
                locationMethodManuallySet = false;
                skipNextMethodReloadRef.current[locationMethodKey] = true;
                dispatch(
                  updatePrayerTimeMethod({
                    methodId: closest.id,
                    manuallySet: false,
                    locationKey: locationMethodKey,
                  }),
                );
              } else if (closest?.id) {
                methodId = closest.id;
              }
            }
          } catch (error) {
            console.warn('[prayer-time] Unable to refresh method list', error);
          }

          const coordsPayload = { lat: latitude, lon: longitude };
          setCoords(coordsPayload);

          // Cihazın O ANKİ tarihine göre vakitler
          const data = await fetchPrayerTimesByCoords(
            latitude,
            longitude,
            baseDate,
            methodId,
            {
              tune: effectiveTuneOffsets,
            },
          );
          setTimings(data);
          setLocationServicesDisabled(false);

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
        if (error instanceof LocationServicesDisabledError) {
          setLocationServicesDisabled(true);
          return;
        }
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
        }
        return;
      } finally {
        setLoading(false);
        isResyncingRef.current = false;
        setIsResyncing(false);
      }
    },
    [
      activeResolved,
      dispatch,
      effectiveTuneOffsets,
      getMethodPreferenceForKey,
      t,
    ],
  );
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);
  useEffect(() => {
    const key = methodKey;
    const nextState = {
      method: activeMethodId,
      manual: activeMethodManuallySet,
    };
    const prev = lastMethodStateRef.current[key];
    if (!prev) {
      lastMethodStateRef.current[key] = nextState;
      return;
    }
    if (prev.method === nextState.method && prev.manual === nextState.manual) {
      return;
    }
    lastMethodStateRef.current[key] = nextState;
    if (skipNextMethodReloadRef.current[key]) {
      skipNextMethodReloadRef.current[key] = false;
      return;
    }
    loadRef.current(new Date());
  }, [activeMethodId, activeMethodManuallySet, methodKey]);

  const tuneSignature = useMemo(
    () => effectiveTuneOffsets.join(','),
    [effectiveTuneOffsets],
  );
  const lastTuneSignatureRef = useRef(tuneSignature);
  useEffect(() => {
    if (lastTuneSignatureRef.current === tuneSignature) {
      return;
    }
    lastTuneSignatureRef.current = tuneSignature;
    loadRef.current(new Date());
  }, [tuneSignature]);

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
    if (!coords || !timings) {
      return;
    }
    let cancelled = false;

    const run = async () => {
      try {
        const schedulingCoords =
          activeResolved.type === 'device'
            ? coords
            : { lat: activeResolved.latitude, lon: activeResolved.longitude };
        const cacheLabel =
          activeResolved.type === 'device'
            ? locationLabel || 'Device Location'
            : activeResolved.label;

        if (activeResolved.type !== 'device') {
          const driftKm = haversineDistanceKm(coords, schedulingCoords);
          if (driftKm > 0.5) {
            return;
          }
        }

        const perPrayer = advancedNotifications?.perPrayer ?? {};
        const silentModeDuration =
          advancedNotifications?.silentModeDuration ?? 'off';
        const silentModeStartedAt =
          advancedNotifications?.silentModeStartedAt ?? null;

        const anyEnabled = PRAYER_ORDER.some(k =>
          (perPrayer[k] ?? []).some(item => item.enabled),
        );

        if (!anyEnabled) {
          await prayerNotificationManager.syncAdvancedNotifications({
            baseSequence: [],
            perPrayer: perPrayer as Record<PrayerTimeKey, any>,
            silentModeDuration,
            silentModeStartedAt,
            buildContent: () => ({ title: '', message: '' }),
          });
          return;
        }

        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const end = new Date(start);
        end.setDate(start.getDate() + NOTIFICATION_WINDOW_DAYS - 1);

        const startYear = start.getFullYear();
        const startMonth = start.getMonth() + 1;
        const endYear = end.getFullYear();
        const endMonth = end.getMonth() + 1;

        let tz: string | undefined;
        try {
          tz = getTimeZoneByCoords(schedulingCoords.lat, schedulingCoords.lon);
        } catch {
          tz = undefined;
        }
        const notificationTuneOffsets = effectiveTuneOffsetsRef.current;

        const month1 = await fetchMonthlyPrayerTimesByCoords(
          startYear,
          startMonth,
          schedulingCoords.lat,
          schedulingCoords.lon,
          activeMethodId,
          tz,
          cacheLabel,
          { tune: notificationTuneOffsets },
        );
        const month2 =
          startYear !== endYear || startMonth !== endMonth
            ? await fetchMonthlyPrayerTimesByCoords(
                endYear,
                endMonth,
                schedulingCoords.lat,
                schedulingCoords.lon,
                activeMethodId,
                tz,
                cacheLabel,
                { tune: notificationTuneOffsets },
              )
            : null;

        if (cancelled) return;
        const sequence = buildNotificationSequenceRange(
          start,
          NOTIFICATION_WINDOW_DAYS,
          month1,
          month2,
          prayerLabels,
        );

        await prayerNotificationManager.syncAdvancedNotifications({
          baseSequence: sequence,
          perPrayer,
          silentModeDuration,
          silentModeStartedAt,
          buildContent: (entry, notifItem) => {
            const abs = Math.abs(notifItem.offsetMinutes);
            const hrs = Math.floor(abs / 60);
            const mins = abs % 60;
            const timeStr =
              hrs > 0 && mins > 0
                ? `${hrs}s ${mins}dk`
                : hrs > 0
                ? `${hrs}s`
                : `${mins}dk`;

            let message: string;
            if (notifItem.offsetMinutes < 0) {
              message = t('notifications.prayerReminderBodyBefore', {
                label: entry.label,
                time: timeStr,
              });
            } else if (notifItem.offsetMinutes > 0) {
              message = t('notifications.prayerReminderBodyAfter', {
                label: entry.label,
                time: timeStr,
              });
            } else {
              message = t('notifications.prayerReminderBody', {
                label: entry.label,
              });
            }
            return {
              title: t('notifications.prayerReminderTitle'),
              message,
            };
          },
          now,
        });
      } catch (error) {
        console.warn('[prayer-time] notification sync failed', error);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    coords,
    timings,
    activeResolved,
    activeMethodId,
    currentDateKey,
    locationLabel,
    t,
    prayerLabels,
    advancedNotifications,
  ]);

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
      const granted = await hasLocationPermission();
      if (!granted) return;
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

  const activeLocationModalLabel = useMemo(() => {
    if (locationLabel && locationLabel.trim().length > 0) {
      return locationLabel;
    }
    if (activeResolved.type === 'device') {
      return t('locationSelector.deviceTitle');
    }
    return activeResolved.label;
  }, [activeResolved, locationLabel, t]);

  useEffect(() => {
    if (!methodOptionsAvailable && methodModalVisible) {
      setMethodModalVisible(false);
    }
  }, [methodModalVisible, methodOptionsAvailable]);

  const openMethodModal = useCallback(() => {
    if (!methodOptionsAvailable) {
      return;
    }
    setMethodModalVisible(true);
  }, [methodOptionsAvailable]);

  const closeMethodModal = useCallback(() => {
    setMethodModalVisible(false);
  }, []);

  const flushPendingTuneUpdates = useCallback(() => {
    if (tuneCommitTimerRef.current) {
      clearTimeout(tuneCommitTimerRef.current);
      tuneCommitTimerRef.current = null;
    }
    const updates = pendingTuneUpdatesRef.current;
    pendingTuneUpdatesRef.current = {};
    const keys = Object.keys(updates) as PrayerTuneKey[];
    if (keys.length === 0) {
      return;
    }
    const nextTune: PrayerTimeTuneSettings = { ...prayerTimeTuneRef.current };
    let changed = false;
    keys.forEach(key => {
      const value = updates[key];
      if (typeof value !== 'number') return;
      if ((prayerTimeTuneRef.current[key] ?? 0) === value) return;
      nextTune[key] = value;
      changed = true;
    });
    if (!changed) {
      return;
    }
    dispatch(setPrayerTimeTuneValues(nextTune));
  }, [dispatch]);

  const scheduleTuneCommit = useCallback(() => {
    if (tuneCommitTimerRef.current) {
      clearTimeout(tuneCommitTimerRef.current);
    }
    tuneCommitTimerRef.current = setTimeout(() => {
      tuneCommitTimerRef.current = null;
      flushPendingTuneUpdates();
    }, TUNE_COMMIT_DEBOUNCE_MS);
  }, [flushPendingTuneUpdates]);

  useEffect(() => {
    prayerTimeTuneRef.current = prayerTimeTune;
    if (!tuneModalVisible && !tuneCommitTimerRef.current) {
      setTuneDraft(prayerTimeTune);
    }
  }, [prayerTimeTune, tuneModalVisible]);

  useEffect(() => {
    return () => {
      if (tuneCommitTimerRef.current) {
        clearTimeout(tuneCommitTimerRef.current);
        tuneCommitTimerRef.current = null;
      }
    };
  }, []);

  const openTuneModal = useCallback(() => {
    pendingTuneUpdatesRef.current = {};
    setTuneDraft(prayerTimeTune);
    setTuneModalVisible(true);
  }, [prayerTimeTune]);

  const closeTuneModal = useCallback(() => {
    flushPendingTuneUpdates();
    setTuneModalVisible(false);
  }, [flushPendingTuneUpdates]);

  const handleManualMethodSelect = useCallback(
    (methodId: number) => {
      dispatch(
        updatePrayerTimeMethod({
          methodId,
          manuallySet: true,
          locationKey: methodKey,
        }),
      );
      closeMethodModal();
    },
    [closeMethodModal, dispatch, methodKey],
  );

  const handleAutoMethodSelect = useCallback(() => {
    const pref = getMethodPreferenceForKey(methodKey);
    dispatch(
      updatePrayerTimeMethod({
        methodId: pref?.methodId ?? DEFAULT_METHOD_ID,
        manuallySet: false,
        locationKey: methodKey,
      }),
    );
    closeMethodModal();
  }, [closeMethodModal, dispatch, getMethodPreferenceForKey, methodKey]);

  const handleTuneStep = useCallback(
    (key: PrayerTuneKey, delta: number) => {
      setTuneDraft(prev => {
        const currentValue = prev[key] ?? 0;
        const nextValue = Math.max(
          TUNE_MIN,
          Math.min(TUNE_MAX, currentValue + delta),
        );
        if (nextValue === currentValue) {
          return prev;
        }
        pendingTuneUpdatesRef.current[key] = nextValue;
        scheduleTuneCommit();
        return {
          ...prev,
          [key]: nextValue,
        };
      });
    },
    [scheduleTuneCommit],
  );

  const getTuneValueText = useCallback(
    (key: PrayerTuneKey) =>
      t('locationSelector.tuneMinuteValue', {
        value: tuneDraft[key] ?? 0,
      }),
    [t, tuneDraft],
  );

  // Timer'ı kur/yeniden kur
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const softRecalc = (now = new Date()) => {
      // Seq henüz hiç yüklenmemişse dokunma; stale (eski güne ait) data varsa
      // yaklaşık doğru sonuç üretir – API yanıtı gelince zaten güncellenir.
      if (!seqRef.current) {
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
        // Güne veya timezone'a göre yeniden senkronize et
        setUtcLabel(getUTCLabel());
        load(now);
        lastDayRef.current = now.getDate();
        lastOffsetRef.current = now.getTimezoneOffset();
      }
      // Yükleme devam etse veya başarısız olsa da mevcut seq ile saati güncelle;
      // böylece hata, arka plan sonrası açılış vb. durumlarda saat donmaz.
      softRecalc(now);

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
            if (locationServicesDisabledRef.current) {
              load(new Date());
            } else {
              checkDeviceLocationChange();
            }
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
      load,
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
        {shouldShowRamadanCountdown && (
          <ContextualHint
            hintId="hint_ramadan_countdown"
            message={t('prayerTime.ramadanCountdownHintMessage')}
            frequencyMs={RAMADAN_HINT_FREQUENCY_MS}
            durationMs={DEFAULT_HINT_DURATION_MS}
          >
            <RamadanCountdownCard
              ramadanInfo={ramadanCountdownInfo}
              currentNow={nowTick}
            />
          </ContextualHint>
        )}
        {showReligiousDaysSlider && (
          <ReligiousDaysSliderCard currentDateKey={currentDateKey} />
        )}
        {showQuranAyahCard && <QuranAyahCard currentDateKey={currentDateKey} />}
        {showAsmaulHusnaCard && (
          <AsmaulHusnaCard currentDateKey={currentDateKey} />
        )}
        {showHadithCard && <HadithCard currentDateKey={currentDateKey} />}
      </View>
    ),
    [
      shouldShowRamadanCountdown,
      ramadanCountdownInfo,
      nowTick,
      showReligiousDaysSlider,
      currentDateKey,
      showQuranAyahCard,
      showAsmaulHusnaCard,
      showHadithCard,
      t,
    ],
  );

  const shouldShowLocationPermissionCard =
    locationPermissionGranted === false && savedLocations.length === 0;
  const shouldShowLocationServicesCard =
    locationServicesDisabled && !timings && activeResolved.type === 'device';

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

  if (shouldShowLocationServicesCard) {
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
                  name="crosshairs-gps"
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
                {t('prayerTime.locationServicesDisabledTitle')}
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
                {t('prayerTime.locationServicesDisabledMessage')}
              </Text>
              <Pressable
                style={[
                  styles.permissionButton,
                  { backgroundColor: currentTheme.primary },
                ]}
                onPress={() => {
                  if (Platform.OS === 'android') {
                    Linking.sendIntent(
                      'android.settings.LOCATION_SOURCE_SETTINGS',
                    ).catch(() => Linking.openSettings());
                  } else {
                    Linking.openSettings();
                  }
                }}
              >
                <Text style={styles.permissionButtonText}>
                  {t('prayerTime.locationServicesOpenSettings')}
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
  const nextKey = nextKeyRef.current;
  const nextLabel = prayerLabels[nextKey] ?? '';
  const currentIcon = PRAYER_TIME_ICONS[currentKeyRef.current] as any;
  const isCritical = seqRef.current
    ? isKerahatTime(seqRef.current, nowTick)
    : false;
  const criticalRed = `${currentTheme.systemRed || '#FF3B30'}E6`;
  const cardBg = isCritical ? criticalRed : `${currentTheme.primary}CC`;

  const countdownBaseTitle =
    nextKey === 'Sunrise'
      ? t('prayerTime.sunriseCountdown')
      : t('prayerTime.nextPrayerCountdown', {
          label: nextLabel,
        });
  const countdownTitle = countdownBaseTitle;
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
                  onOpenTuneEditor={openTuneModal}
                  onOpenPrayerTimeSettings={
                    methodOptionsAvailable ? openMethodModal : undefined
                  }
                  locationHintMessage={t('prayerTime.locationHintMessage')}
                  locationHintFrequencyMs={LOCATION_HINT_FREQUENCY_MS}
                  locationHintDurationMs={DEFAULT_HINT_DURATION_MS}
                />
                <PrayerTimeHeader
                  cardBg={cardBg}
                  iconType={currentIcon.type}
                  iconName={currentIcon.name as any}
                  countdownTitle={countdownTitle}
                  showKerahatBar={isCritical}
                  kerahatLabel={t('prayerTime.kerahatTimeLabel')}
                  kerahatTextColor={currentTheme.systemRed || '#FF3B30'}
                  leftClock={leftClock}
                  isResyncing={isResyncing}
                  seqDateLabel={seqDateLabel}
                  hijriDateLabel={hijriDateLabel}
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
            onScroll={({ nativeEvent }) => {
              if (isCloseToBottom(nativeEvent)) {
                dispatch(updateAppConfig({ isScrollReachToBottom: true }));
              } else {
                dispatch(updateAppConfig({ isScrollReachToBottom: false }));
              }
            }}
          />
          <Modal
            transparent
            animationType="fade"
            visible={methodModalVisible && methodOptionsAvailable}
            onRequestClose={closeMethodModal}
          >
            <View style={styles.methodModalOverlay}>
              <Pressable
                style={styles.methodModalBackdrop}
                onPress={closeMethodModal}
              />
              <View
                style={[
                  styles.methodModalCard,
                  { backgroundColor: currentTheme.cardViewBackgroundColor },
                ]}
              >
                <Text
                  style={[
                    styles.methodModalTitle,
                    { color: currentTheme.textColor },
                  ]}
                >
                  {t('locationSelector.methodModalTitle', {
                    location: activeLocationModalLabel,
                  })}
                </Text>
                <Text
                  style={[
                    styles.methodModalSubtitle,
                    { color: currentTheme.textColor },
                  ]}
                >
                  {t('locationSelector.methodModalSubtitle', {
                    location: activeLocationModalLabel,
                  })}
                </Text>
                <Pressable
                  style={[
                    styles.methodAutoCard,
                    { borderColor: currentTheme.primary },
                  ]}
                  onPress={handleAutoMethodSelect}
                >
                  <View style={styles.methodOptionTextBlock}>
                    <Text
                      style={[
                        styles.methodOptionTitle,
                        { color: currentTheme.textColor },
                      ]}
                    >
                      {t('locationSelector.methodAutoOption')}
                    </Text>
                    <Text
                      style={[
                        styles.methodOptionSubtitle,
                        { color: currentTheme.textColor },
                      ]}
                    >
                      {t('locationSelector.methodAutoDescription', {
                        name: activeMethodInfo.methodName,
                        location: activeLocationModalLabel,
                      })}
                    </Text>
                  </View>
                  {!activeMethodInfo.pref.manuallySet && (
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="check"
                      size={20}
                      color={currentTheme.primary}
                    />
                  )}
                </Pressable>
                <View
                  style={[
                    styles.methodListDivider,
                    { backgroundColor: currentTheme.textColor, opacity: 0.15 },
                  ]}
                />
                <ScrollView
                  style={styles.methodModalScroll}
                  contentContainerStyle={styles.methodModalScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {methodOptions.map((item, index) => {
                    const selected =
                      activeMethodInfo.pref.manuallySet &&
                      activeMethodInfo.pref.methodId === item.id;
                    return (
                      <View key={String(item.id)}>
                        <Pressable
                          style={styles.methodOptionRow}
                          onPress={() => handleManualMethodSelect(item.id)}
                        >
                          <Text
                            style={[
                              styles.methodOptionTitle,
                              { color: currentTheme.textColor },
                            ]}
                          >
                            {formatMethodName(item.name)}
                          </Text>
                          {selected && (
                            <Icon
                              type={Icons.MaterialDesignIcons}
                              name="check"
                              size={20}
                              color={currentTheme.primary}
                            />
                          )}
                        </Pressable>
                        {index < methodOptions.length - 1 ? (
                          <View
                            style={[
                              styles.methodOptionSeparator,
                              {
                                backgroundColor: currentTheme.textColor,
                                opacity: 0.15,
                              },
                            ]}
                          />
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
          <Modal
            transparent
            animationType="fade"
            visible={tuneModalVisible}
            onRequestClose={closeTuneModal}
          >
            <View style={styles.methodModalOverlay}>
              <Pressable
                style={styles.methodModalBackdrop}
                onPress={closeTuneModal}
              />
              <View
                style={[
                  styles.methodModalCard,
                  { backgroundColor: currentTheme.cardViewBackgroundColor },
                ]}
              >
                <Text
                  style={[
                    styles.methodModalTitle,
                    { color: currentTheme.textColor },
                  ]}
                >
                  {t('locationSelector.tuneTitle')}
                </Text>
                <Text
                  style={[
                    styles.methodModalSubtitle,
                    { color: currentTheme.textColor },
                  ]}
                >
                  {t('locationSelector.tuneModalSubtitle', {
                    location: activeLocationModalLabel,
                  })}
                </Text>
                <ScrollView
                  style={styles.tuneModalScroll}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.tuneRows}>
                    {TUNE_CONTROL_ITEMS.map(item => {
                      const value = tuneDraft[item.key] ?? 0;
                      const isDecrementDisabled = value <= TUNE_MIN;
                      const isIncrementDisabled = value >= TUNE_MAX;
                      return (
                        <View key={item.key} style={styles.tuneRow}>
                          <View style={styles.tuneTextBlock}>
                            <Text
                              style={[
                                styles.tuneLabel,
                                { color: currentTheme.textColor },
                              ]}
                            >
                              {t(item.labelKey)}
                            </Text>
                            <Text
                              style={[
                                styles.tuneValue,
                                { color: currentTheme.textColor },
                              ]}
                            >
                              {getTuneValueText(item.key)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.tuneStepper,
                              {
                                backgroundColor:
                                  currentTheme.inputBackgroundColor,
                              },
                            ]}
                          >
                            <Pressable
                              style={[
                                styles.tuneStepperButton,
                                isDecrementDisabled &&
                                  styles.tuneStepperDisabled,
                              ]}
                              onPress={() =>
                                handleTuneStep(item.key, -TUNE_STEP)
                              }
                              disabled={isDecrementDisabled}
                            >
                              <Text
                                style={[
                                  styles.tuneStepperSymbol,
                                  { color: currentTheme.textColor },
                                ]}
                              >
                                -
                              </Text>
                            </Pressable>
                            <View
                              style={[
                                styles.tuneStepperDivider,
                                {
                                  backgroundColor: `${currentTheme.textColor}22`,
                                },
                              ]}
                            />
                            <Pressable
                              style={[
                                styles.tuneStepperButton,
                                isIncrementDisabled &&
                                  styles.tuneStepperDisabled,
                              ]}
                              onPress={() =>
                                handleTuneStep(item.key, TUNE_STEP)
                              }
                              disabled={isIncrementDisabled}
                            >
                              <Text
                                style={[
                                  styles.tuneStepperSymbol,
                                  { color: currentTheme.textColor },
                                ]}
                              >
                                +
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
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
  methodModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  methodModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  methodModalCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    maxHeight: '92%',
  },
  methodModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  methodModalSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  methodAutoCard: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  methodOptionTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  methodOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  methodOptionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  methodOptionSubtitle: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 4,
  },
  methodOptionSeparator: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  methodListDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 6,
  },
  methodModalScroll: {
    maxHeight: '100%',
  },
  methodModalScrollContent: {
    paddingVertical: 4,
    paddingBottom: 8,
    gap: 0,
  },
  tuneModalScroll: {
    maxHeight: 380,
    marginTop: 4,
  },
  tuneRows: {
    gap: 10,
  },
  tuneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tuneTextBlock: {
    flex: 1,
    gap: 2,
  },
  tuneLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tuneValue: {
    fontSize: 14,
    opacity: 0.88,
  },
  tuneStepper: {
    width: 132,
    height: 42,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tuneStepperButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuneStepperDisabled: {
    opacity: 0.45,
  },
  tuneStepperDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  tuneStepperSymbol: {
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '400',
    marginTop: -2,
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
  nextCardWrapperWithKerahat: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  nextKerahatBar: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15,23,42,0.12)',
  },
  nextKerahatText: {
    fontWeight: '700',
    textAlign: 'center',
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
  hijriText: {
    opacity: 0.85,
    marginTop: 2,
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
    width: '100%',
  },
  ramadanContentColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 10,
  },
  ramadanActiveText: {
    fontSize: 15,
    fontWeight: '700',
  },
  ramadanCountdownWrap: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ramadanCountdownText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    minWidth: 120,
  },
});
