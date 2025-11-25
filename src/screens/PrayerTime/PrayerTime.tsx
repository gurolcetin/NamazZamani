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
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  AppState,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';

import { PrayerTimings, fetchPrayerTimesByCoords } from './api';
import { requestLocationPermission, getCurrentPosition } from './permission';
import {
  Icon,
  PRAYER_TIME_ICONS,
  PrayerTimeSmallCard,
  SafeAreaWithStatusBar,
  ScreenViewContainer,
} from '../../../libs/components';
import { useTheme } from '../../../libs/core/providers';
import { reverseGeocode, getUTCLabel } from './reverse-geocode';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { PrayerTimeScreens } from '../../navigation/Routes';
import { selectActiveResolved } from '../../../libs/redux/reducers/location';
import {
  getTimeZoneByCoords,
  getUtcLabelFromTimeZone,
} from '../../../libs/core/helpers';
import { ActionCardGroup } from './action-cards/action-card-group';
import { PrayerTimeKey, SmallCard } from '../../../libs/common/types';
import {
  LanguageLocaleKeys,
  LanguagePrefix,
} from '../../../libs/common/constants';
import { useTranslation } from 'react-i18next';

// ----- Types & Maps ---------------------------------------------------------

const PRAYER_ORDER: PrayerTimeKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

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
const MAX_SPAN_SEC = 26 * 3600; // güvenli üst sınır (clamp)

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
  syncingText: string;
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
    syncingText,
  }) => {
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
                  size={26}
                  solid
                />
              </View>

              {/* Metinler */}
              <View style={styles.nextTextWrap}>
                <Text style={styles.nextLabelText}>{countdownTitle}</Text>
                <Text style={styles.nextBigTime}>{leftClock}</Text>
              </View>
            </View>

            {/* Sağ altta tarih / sync */}
            <View style={styles.nextMeta}>
              {!isResyncing && !!seqDateLabel && (
                <Text style={styles.metaText} numberOfLines={1}>
                  {seqDateLabel}
                </Text>
              )}
              {isResyncing && (
                <View style={styles.metaSyncRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.metaText}>{syncingText}</Text>
                </View>
              )}
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

  const { t, i18n } = useTranslation();
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [leftClock, setLeftClock] = useState('00:00:00');
  const [leftSec, setLeftSec] = useState(0);
  const nextKeyRef = useRef<PrayerTimeKey>('Fajr');
  const currentKeyRef = useRef<PrayerTimeKey>('Fajr');

  const [locationLabel, setLocationLabel] = useState<string>('');
  const [utcLabel, setUtcLabel] = useState<string>(getUTCLabel());
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  // Senkron durumu: hem ref (timer closure güvenliği) hem state (UI)
  const isResyncingRef = useRef<boolean>(false);
  const [isResyncing, setIsResyncing] = useState(false);

  // Artık string yerine baz alınan tarih state’i
  const [seqBaseDate, setSeqBaseDate] = useState<Date>(new Date());

  // Jump/day/TZ izleme
  const seqRef = useRef<ReturnType<typeof buildSequence> | null>(null);
  const seqBaseDayRef = useRef<string>(ymd(new Date())); // seq hangi güne ait
  const lastNowRef = useRef<Date>(new Date());
  const lastOffsetRef = useRef<number>(new Date().getTimezoneOffset());
  const lastDayRef = useRef<number>(new Date().getDate());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const systemDark = useColorScheme() === 'dark';
  const navigation = useNavigation();

  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  const prayerLabels = useMemo(() => {
    return PRAYER_ORDER.reduce((acc, key) => {
      acc[key] = t(PRAYER_NAME_KEYS[key]);
      return acc;
    }, {} as Record<PrayerTimeKey, string>);
  }, [t]);

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
    async (baseDate: Date = new Date()) => {
      try {
        setLoading(true);
        isResyncingRef.current = true;
        setIsResyncing(true);

        let latitude: number | null = null;
        let longitude: number | null = null;
        let label: string | null = null;

        if ('type' in activeResolved && activeResolved.type === 'device') {
          const ok = await requestLocationPermission();
          if (!ok) return;
          const pos = await getCurrentPosition();
          latitude = pos.latitude;
          longitude = pos.longitude;
          try {
            label = await reverseGeocode(latitude, longitude);
          } catch {
            label = t('prayerTime.locationNotFound');
          }
        } else {
          latitude = activeResolved.latitude;
          longitude = activeResolved.longitude;
          label = activeResolved.label;
        }

        if (latitude != null && longitude != null) {
          setCoords({ lat: latitude, lon: longitude });

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
        }
        if (label) setLocationLabel(label);
      } finally {
        setLoading(false);
        isResyncingRef.current = false;
        setIsResyncing(false);
      }
    },
    [activeResolved, t],
  );

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

  // ilk yükleme
  useEffect(() => {
    load();
  }, [load]);

  // Pull-to-refresh için handler
  const handleRefresh = useCallback(async () => {
    if (isResyncingRef.current) {
      // Zaten reload çalışıyorsa ikinci isteğe gerek yok
      return;
    }
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
      if (
        isResyncingRef.current ||
        !seqRef.current ||
        seqBaseDayRef.current !== ymd(now)
      ) {
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
      const delta = now.getTime() - lastNowRef.current.getTime();

      const jumped =
        Math.abs(delta - 1000) > 2000 ||
        now.getTime() < lastNowRef.current.getTime();

      const dayChanged = now.getDate() !== lastDayRef.current;
      const tzChanged = now.getTimezoneOffset() !== lastOffsetRef.current;

      if (dayChanged || tzChanged || jumped) {
        // UI’yı sabit tut (flicker yok), yeni güne göre veriyi getir
        setUtcLabel(getUTCLabel());
        load(now);
        lastDayRef.current = now.getDate();
        lastOffsetRef.current = now.getTimezoneOffset();

        // Büyük jump’ta interval’ı tazele
        if (jumped) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(tick, 1000);
        }
      } else {
        softRecalc(now);
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
      startTimer();

      const appSub = AppState.addEventListener('change', s => {
        if (s === 'active') {
          // Uygulama yeniden aktive olduğunda, eğer bu ekran odaktaysa timer'ı tazele
          startTimer();
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
    }, [startTimer]),
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

  // ------- render -----------------------------------------------------------
  if (loading && !timings) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>{t('prayerTime.loadingTimes')}</Text>
      </View>
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
  const syncingText = t('prayerTime.syncing');

  return (
    <SafeAreaWithStatusBar>
      <ScreenViewContainer>
        <View style={styles.screenInner}>
          {/* Konum + 3 buton */}
          <ActionCardGroup
            label={locationLabel}
            utc={utcLabel}
            loading={(loading || isResyncing) && !timings}
            isDark={systemDark}
            theme={{
              primary: currentTheme.primary,
              textColor: currentTheme.textColor,
              cardViewBackgroundColor: currentTheme.cardViewBackgroundColor,
            }}
            onOpenLocationSelector={() =>
              navigation.navigate(PrayerTimeScreens.LocationSelector as never)
            }
            onPickDate={() => {
              if (!coords) return;
              navigation.navigate(PrayerTimeScreens.MontlyCalendar as never);
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

          <FlatList
            data={smallCards}
            numColumns={2}
            keyExtractor={i => i.key}
            renderItem={renderSmallCard}
            ListHeaderComponent={
              <PrayerTimeHeader
                cardBg={cardBg}
                iconType={currentIcon.type}
                iconName={currentIcon.name as any}
                countdownTitle={countdownTitle}
                leftClock={leftClock}
                isResyncing={isResyncing}
                seqDateLabel={seqDateLabel}
                syncingText={syncingText}
              />
            }
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
      </ScreenViewContainer>
    </SafeAreaWithStatusBar>
  );
}

// ----- styles ---------------------------------------------------------------
const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8 },
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
  columnWrapper: { justifyContent: 'space-between' },
  listHeaderRoot: {
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
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
  metaSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
