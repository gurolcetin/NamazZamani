import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useTheme } from '../../../../libs/core/providers';
import { FontScaleOption } from '../../../../libs/common/enums';
import {
  convertMiladiDateToHicriDate,
  getFontScaleMultiplier,
} from '../../../../libs/core/helpers';
import type { RootState } from '../../../../libs/redux/store';
import {
  LanguageLocaleKeys,
  LanguagePrefix,
} from '../../../../libs/common/constants';

/* ----------------------------------------------------
 * HICRÎ TARİH TİPİ
 * ---------------------------------------------------- */
type HijriDate = {
  dayOfWeekText: string;
  dayOfWeek: number; // 1–7
  dayOfMonth: number; // Hicrî gün
  month: number; // 1–12
  monthText: string;
  year: number;
};

/* ----------------------------------------------------
 * SLIDE YAPISI
 * ---------------------------------------------------- */
type HijriEvent = {
  id: string;
  hijriDay: number;
  hijriMonth: number;
};

type SlideConfig = {
  id: string;
  mainEvent: HijriEvent;
  titleKey: string;
  descriptionKey?: string;
  extraInfoKey?: string;
};

/* ----------------------------------------------------
 * SLIDE TANIMLARI
 * ---------------------------------------------------- */
const SLIDES: SlideConfig[] = [
  {
    id: 'threeMonths',
    mainEvent: { id: 'threeMonthsStart', hijriDay: 1, hijriMonth: 7 }, // 1 Receb
    titleKey: 'prayerTime.religiousDays.slides.threeMonths.title',
    descriptionKey: 'prayerTime.religiousDays.slides.threeMonths.description',
  },
  {
    id: 'ramadan',
    mainEvent: { id: 'ramadanStart', hijriDay: 1, hijriMonth: 9 },
    titleKey: 'prayerTime.religiousDays.slides.ramadan.title',
    descriptionKey: 'prayerTime.religiousDays.slides.ramadan.description',
    extraInfoKey: '',
  },
  {
    id: 'eidFitr',
    mainEvent: { id: 'eidFitr', hijriDay: 1, hijriMonth: 10 },
    titleKey: 'prayerTime.religiousDays.slides.eidFitr.title',
    descriptionKey: 'prayerTime.religiousDays.slides.eidFitr.description',
    extraInfoKey: '',
  },
  {
    id: 'eidAdha',
    mainEvent: { id: 'eidAdha', hijriDay: 10, hijriMonth: 12 },
    titleKey: 'prayerTime.religiousDays.slides.eidAdha.title',
    descriptionKey: 'prayerTime.religiousDays.slides.eidAdha.description',
  },
  {
    id: 'otherDays',
    mainEvent: { id: 'hijriNewYear', hijriDay: 1, hijriMonth: 1 },
    titleKey: 'prayerTime.religiousDays.slides.otherDays.title',
    descriptionKey: 'prayerTime.religiousDays.slides.otherDays.description',
  },
];

const OTHER_EVENTS: HijriEvent[] = [
  { id: 'hijriNewYear', hijriDay: 1, hijriMonth: 1 },
  { id: 'ashura', hijriDay: 10, hijriMonth: 1 },
  { id: 'mawlid', hijriDay: 12, hijriMonth: 3 },
];

/**
 * Üç aylarla ilgili öne çıkan geceler:
 * Regaib, Berat
 */
const THREE_MONTHS_SPECIAL_NIGHTS: HijriEvent[] = [
  { id: 'regaib', hijriDay: 1, hijriMonth: 7 }, // Receb 1 (Regaib Kandili)
  { id: 'berat', hijriDay: 15, hijriMonth: 8 }, // Şaban 15 (Berat Kandili)
];

/**
 * Ramazan ile ilgili öne çıkan gece:
 * Kadir
 */
const RAMADAN_SPECIAL_NIGHTS: HijriEvent[] = [
  { id: 'qadr', hijriDay: 27, hijriMonth: 9 }, // Ramazan 27 (Kadir Gecesi)
];

/* ----------------------------------------------------
 * STİLLER
 * ---------------------------------------------------- */
const createStyles = (
  colors: {
    cardBg: string;
    primary: string;
    textColor: string;
    shadowColor: string;
    muted: string;
  },
  fontScale: number,
) =>
  StyleSheet.create({
    card: {
      marginTop: 16,
      borderRadius: 24,
      padding: 20,
      backgroundColor: colors.cardBg,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 16 * fontScale,
      fontWeight: '700',
      color: colors.textColor,
    },
    subtitle: {
      fontSize: 12 * fontScale,
      color: colors.muted,
      marginTop: 2,
    },
    sliderContainer: {
      marginTop: 8,
    },
    slide: {
      paddingVertical: 4,
    },
    slideTitle: {
      fontSize: 15 * fontScale,
      fontWeight: '600',
      color: colors.textColor,
      marginBottom: 4,
    },
    mainValue: {
      fontSize: 22 * fontScale,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 6,
    },
    description: {
      fontSize: 13 * fontScale,
      color: colors.textColor,
      marginBottom: 4,
    },
    extraInfo: {
      fontSize: 12 * fontScale,
      color: colors.muted,
      marginTop: 2,
    },

    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(148,163,184,0.4)',
    },
    dotActive: {
      width: 18,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },

    otherRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    otherLabel: {
      fontSize: 12 * fontScale,
      color: colors.textColor,
    },
    otherValue: {
      fontSize: 14 * fontScale,
      fontWeight: '600',
      color: colors.primary,
    },
    miniDate: {
      fontSize: 11 * fontScale,
      color: colors.muted,
      marginBottom: 6,
    },
  });

/* ----------------------------------------------------
 * HEDEF HİCRÎ GÜNÜN MİLADİ KARŞILIĞINI BULMA
 * ---------------------------------------------------- */
const findNextGregorianDateForHijri = (
  hijriDay: number,
  hijriMonth: number,
  fromDate: Date,
): Date | null => {
  const start = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  );

  let cursor = new Date(start);
  for (let i = 0; i < 500; i++) {
    const h = convertMiladiDateToHicriDate(cursor);

    if (h.dayOfMonth === hijriDay && h.month === hijriMonth) {
      if (cursor.getTime() < fromDate.getTime()) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
      return cursor;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return null;
};

/**
 * Regaib Kandili Receb ayının ilk perşembe gecesidir.
 * Receb ayının başlangıç tarihini tespit edip ilk perşembeyi buluyoruz.
 */
const findUpcomingRegaibDate = (fromDate: Date): Date | null => {
  const normalized = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  );
  const cursor = new Date(normalized);
  cursor.setDate(cursor.getDate() - 40);

  for (let i = 0; i < 800; i++) {
    const hijri = convertMiladiDateToHicriDate(cursor);
    if (hijri.month === 7 && hijri.dayOfMonth === 1) {
      const startOfRajab = new Date(cursor);
      const desiredWeekday = 4; // Thursday
      const offset = (desiredWeekday - startOfRajab.getDay() + 7) % 7;
      const regaibDate = new Date(startOfRajab);
      regaibDate.setDate(regaibDate.getDate() + offset);

      if (regaibDate.getTime() >= normalized.getTime()) {
        return regaibDate;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return null;
};

/* ----------------------------------------------------
 * GERİ SAYIM FORMATLAYICI
 * ---------------------------------------------------- */
const formatRemaining = (
  now: Date,
  target: Date | null,
  lang: string,
): string => {
  if (!target) return '-';

  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return lang.startsWith('tr') ? 'Tamamlandı' : 'Completed';
  }

  const oneDay = 24 * 60 * 60 * 1000;

  if (diff > oneDay) {
    const d = Math.floor(diff / oneDay);
    if (d === 1) {
      return lang.startsWith('tr') ? 'Yarın' : 'Tomorrow';
    }
    return lang.startsWith('tr') ? `${d} gün` : `${d} days`;
  }

  const total = Math.floor(diff / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');

  return `${h}:${m}:${s}`;
};

/**
 * Sadece "X gün" formatı için – özel geceler satırlarında kullanılıyor.
 */
const formatRemainingDaysOnly = (
  now: Date,
  target: Date | null,
  lang: string,
): string => {
  if (!target) return '-';

  const diff = target.getTime() - now.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff <= 0) {
    return lang.startsWith('tr') ? 'Tamamlandı' : 'Completed';
  }

  const d = Math.ceil(diff / oneDay);
  if (d === 1) {
    return lang.startsWith('tr') ? 'Yarın' : 'Tomorrow';
  }
  return lang.startsWith('tr') ? `${d} gün` : `${d} days`;
};

/* ----------------------------------------------------
 * FAZ BELİRLEME (Receb–Şaban–Ramazan)
 * ---------------------------------------------------- */
const getCurrentPhaseIndex = (today: HijriDate): number => {
  const { dayOfMonth, month } = today;

  const inThreeMonths = month === 7 || month === 8 || month === 9;
  const inRamadan = month === 9;

  if (!inThreeMonths) return 0;
  if (inThreeMonths && !inRamadan) return 1;
  if (inRamadan) return 2;

  if (month === 10 || month === 11 || (month === 12 && dayOfMonth < 10)) {
    return 3;
  }

  return 4;
};

const isWithinThreeMonths = (today: HijriDate): boolean => {
  return today.month >= 7 && today.month <= 9;
};

const getUpcomingThreeMonthsSpecialNight = (
  today: HijriDate,
  targets: Record<string, Date | null>,
  currentDate: Date,
): HijriEvent | null => {
  if (!isWithinThreeMonths(today)) {
    return null;
  }

  for (const evt of THREE_MONTHS_SPECIAL_NIGHTS) {
    const target = targets[evt.id];
    if (!target) continue;

    if (target.getTime() >= currentDate.getTime()) {
      return evt;
    }
  }

  return null;
};

/* ----------------------------------------------------
 * ANA BİLEŞEN
 * ---------------------------------------------------- */
type Props = {
  currentDateKey: string;
};

const ReligiousDaysSliderCardComponent: React.FC<Props> = ({
  currentDateKey,
}) => {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const fontScalePreference = useSelector(
    (s: RootState) =>
      s.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);

  const styles = useMemo(
    () =>
      createStyles(
        {
          cardBg: currentTheme.cardViewBackgroundColor,
          primary: currentTheme.primary,
          textColor: currentTheme.textColor,
          shadowColor: currentTheme.shadowColor || '#0F172A',
          muted: currentTheme.placeholderTextColor || 'rgba(148,163,184,0.8)',
        },
        fontScaleMultiplier,
      ),
    [currentTheme, fontScaleMultiplier],
  );

  const [now, setNow] = useState(new Date());
  const [todayHijri, setTodayHijri] = useState<HijriDate>(
    convertMiladiDateToHicriDate(new Date()),
  );
  const [slideWidth, setSlideWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );
  const scrollRef = useRef<ScrollView>(null);

  /* her saniye geri sayımı güncelle */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  /* tarih değişince hicrî ve miladi gün güncelle */
  useEffect(() => {
    setTodayHijri(convertMiladiDateToHicriDate(new Date()));
    setNow(new Date());
  }, [currentDateKey]);

  const startOfToday = useMemo(
    () => dateFromYMD(currentDateKey),
    [currentDateKey],
  );

  const currentPhaseIndex = useMemo(
    () => getCurrentPhaseIndex(todayHijri),
    [todayHijri],
  );

  function dateFromYMD(ymd: string) {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d); // LOCAL midnight
  }

  /**
   * Hicrî günlerin miladî karşılıklarını günlük olarak hesaplayıp sakla.
   * currentDateKey değiştiğinde (cihaz tarihi değişince) yeniden hesaplanır.
   */
  const eventTargets = useMemo(() => {
    const baseDate = new Date(startOfToday);
    const result: Record<string, Date | null> = {};

    const cacheEventDate = (event: HijriEvent) => {
      if (event.id === 'regaib') {
        result[event.id] = findUpcomingRegaibDate(baseDate);
        return;
      }
      result[event.id] = findNextGregorianDateForHijri(
        event.hijriDay,
        event.hijriMonth,
        baseDate,
      );
    };

    SLIDES.forEach(slide => cacheEventDate(slide.mainEvent));
    OTHER_EVENTS.forEach(cacheEventDate);
    THREE_MONTHS_SPECIAL_NIGHTS.forEach(cacheEventDate);
    RAMADAN_SPECIAL_NIGHTS.forEach(cacheEventDate);

    return result;
  }, [startOfToday]);

  const upcomingThreeMonthsNight = useMemo(
    () =>
      getUpcomingThreeMonthsSpecialNight(
        todayHijri,
        eventTargets,
        startOfToday,
      ),
    [todayHijri, eventTargets, startOfToday],
  );

  const upcomingThreeMonthsNightLabelKey = useMemo(() => {
    if (!upcomingThreeMonthsNight) {
      return null;
    }

    return upcomingThreeMonthsNight.id === 'regaib'
      ? 'prayerTime.religiousDays.slides.ramadan.regaib'
      : 'prayerTime.religiousDays.slides.ramadan.berat';
  }, [upcomingThreeMonthsNight]);

  const upcomingThreeMonthsNightTarget = useMemo(() => {
    if (!upcomingThreeMonthsNight) {
      return null;
    }

    return eventTargets[upcomingThreeMonthsNight.id] ?? null;
  }, [eventTargets, upcomingThreeMonthsNight]);

  /* slider açılışta doğru faza gitsin */
  useEffect(() => {
    if (!slideWidth) return;

    const phase = currentPhaseIndex;
    setActiveIndex(phase);

    scrollRef.current?.scrollTo({ x: phase * slideWidth, animated: false });
  }, [currentPhaseIndex, slideWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setSlideWidth(e.nativeEvent.layout.width);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!slideWidth) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(index);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return date.toLocaleDateString(dateLocale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  /* tek bir slide'ın içeriğini üret */
  const renderSlideContent = (slide: SlideConfig) => {
    const target = eventTargets[slide.mainEvent.id] ?? null;
    const isThreeMonthsSlide = slide.id === 'threeMonths';
    const showThreeMonthsOngoingState =
      isThreeMonthsSlide && Boolean(upcomingThreeMonthsNight);

    const remaining = showThreeMonthsOngoingState
      ? ''
      : formatRemaining(now, target, i18n.language);

    const displayValue = showThreeMonthsOngoingState
      ? t('prayerTime.religiousDays.slides.threeMonths.ongoing')
      : remaining;

    const displayDate = showThreeMonthsOngoingState
      ? formatDate(upcomingThreeMonthsNightTarget)
      : formatDate(target);

    return (
      <View style={styles.slide}>
        {slide.id !== 'otherDays' && (
          <>
            <Text style={styles.slideTitle}>{t(slide.titleKey)}</Text>
            <Text style={styles.mainValue}>{displayValue}</Text>
            <Text style={styles.miniDate}>{displayDate}</Text>
          </>
        )}

        {slide.descriptionKey && slide.id !== 'otherDays' && (
          <Text style={styles.description}>{t(slide.descriptionKey)}</Text>
        )}

        {/* Diğer slaytlar için ekstra bilgi */}
        {slide.extraInfoKey && slide.id !== 'ramadan' && (
          <Text style={styles.extraInfo}>{t(slide.extraInfoKey)}</Text>
        )}

        {showThreeMonthsOngoingState &&
          upcomingThreeMonthsNightLabelKey && (
            <Text style={styles.extraInfo}>
              {t('prayerTime.religiousDays.slides.threeMonths.nextNight', {
                night: t(upcomingThreeMonthsNightLabelKey),
              })}
            </Text>
          )}

        {/* Üç aylar slaytında: Regaib / Berat satırları */}
        {slide.id === 'threeMonths' && (
          <View style={{ marginTop: 8 }}>
            {slide.extraInfoKey && (
              <Text style={styles.extraInfo}>{t(slide.extraInfoKey)}</Text>
            )}

            {THREE_MONTHS_SPECIAL_NIGHTS.map(evt => {
              const target2 = eventTargets[evt.id] ?? null;
              const remainingDays = formatRemainingDaysOnly(
                now,
                target2,
                i18n.language,
              );

              // Mevcut çeviri key'lerini bozmamak için ramadan.* key'leri kullanılabilir
              const labelKey =
                evt.id === 'regaib'
                  ? 'prayerTime.religiousDays.slides.ramadan.regaib'
                  : 'prayerTime.religiousDays.slides.ramadan.berat';

              return (
                <View key={evt.id} style={styles.otherRow}>
                  <Text style={styles.otherLabel}>{t(labelKey)}</Text>
                  <Text style={styles.otherValue}>{remainingDays}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Ramazan slaytında: sadece Kadir Gecesi satırı */}
        {slide.id === 'ramadan' && (
          <View style={{ marginTop: 8 }}>
            {slide.extraInfoKey && (
              <Text style={styles.extraInfo}>{t(slide.extraInfoKey)}</Text>
            )}

            {RAMADAN_SPECIAL_NIGHTS.map(evt => {
              const target2 = eventTargets[evt.id] ?? null;
              const remainingDays = formatRemainingDaysOnly(
                now,
                target2,
                i18n.language,
              );

              const labelKey =
                'prayerTime.religiousDays.slides.ramadan.kadir';

              return (
                <View key={evt.id} style={styles.otherRow}>
                  <Text style={styles.otherLabel}>{t(labelKey)}</Text>
                  <Text style={styles.otherValue}>{remainingDays}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Hicrî yılbaşı / Aşure / Mevlid – otherDays slaytı */}
        {slide.id === 'otherDays' &&
          OTHER_EVENTS.map(evt => {
            const target2 = eventTargets[evt.id] ?? null;
            const rem2 = formatRemaining(now, target2, i18n.language);

            const label =
              evt.id === 'hijriNewYear'
                ? 'prayerTime.religiousDays.other.hijriNewYear'
                : evt.id === 'ashura'
                ? 'prayerTime.religiousDays.other.ashura'
                : 'prayerTime.religiousDays.other.mawlid';

            return (
              <View key={evt.id} style={styles.otherRow}>
                <Text style={styles.otherLabel}>{t(label)}</Text>
                <Text style={styles.otherValue}>{rem2}</Text>
              </View>
            );
          })}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>
            {t('prayerTime.religiousDays.title')}
          </Text>
        </View>
      </View>

      {/* SLIDER */}
      <View onLayout={handleLayout}>
        {slideWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {SLIDES.map(slide => (
              <View key={slide.id} style={{ width: slideWidth }}>
                {renderSlideContent(slide)}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* SLIDER DOTS */}
      <View style={styles.dotsRow}>
        {SLIDES.map((slide, idx) => (
          <View
            key={slide.id}
            style={[styles.dot, idx === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
};

export const ReligiousDaysSliderCard = memo(ReligiousDaysSliderCardComponent);
