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

/* ----------------------------------------------------
 * HICRÎ TARİH TİPİ (Senin fonksiyonuna göre)
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
 * SLIDE TANIMLARI (Kurallarına göre 1–5)
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
    extraInfoKey: 'prayerTime.religiousDays.slides.ramadan.extraNights',
  },
  {
    id: 'eidFitr',
    mainEvent: { id: 'eidFitr', hijriDay: 1, hijriMonth: 10 },
    titleKey: 'prayerTime.religiousDays.slides.eidFitr.title',
    descriptionKey: 'prayerTime.religiousDays.slides.eidFitr.description',
    extraInfoKey: 'prayerTime.religiousDays.slides.eidFitr.extraNight',
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
    badgeBg: string;
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
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.badgeBg,
    },
    badgeText: {
      fontSize: 11 * fontScale,
      fontWeight: '600',
      color: colors.primary,
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
  });

/* ----------------------------------------------------
 * HEDEF HİCRÎ GÜNÜN MİLADİ KARŞILIĞINI BULMA (GÜNCELLENDİ)
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
      if (cursor.getTime() <= fromDate.getTime()) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
      return cursor;
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
    return lang.startsWith('tr') ? `${d} gün` : `${d} days`;
  }

  const total = Math.floor(diff / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');

  return `${h}:${m}:${s}`;
};

/* ----------------------------------------------------
 * FAZ BELİRLEME – SENİN HİCRÎ SİSTEMİNE UYUMLU (Receb–Şaban–Ramazan)
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
          muted: 'rgba(148,163,184,0.8)',
          badgeBg: 'rgba(59,130,246,0.12)',
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

  const scrollRef = useRef<ScrollView>(null);

  /* her saniye geri sayımı güncelle */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* tarih değişince hicrî gün güncelle */
  useEffect(() => {
    setTodayHijri(convertMiladiDateToHicriDate(new Date()));
  }, [currentDateKey]);

  const currentPhaseIndex = useMemo(
    () => getCurrentPhaseIndex(todayHijri),
    [todayHijri],
  );

  /**
   * Hicrî günlerin miladî karşılıklarını günlük olarak hesaplayıp sakla.
   * Böylece her saniye render olan geri sayımda ağır hesaplamalar tekrar etmez.
   */
  const eventTargets = useMemo(() => {
    const baseDate = new Date();
    const result: Record<string, Date | null> = {};

    const cacheEventDate = (event: HijriEvent) => {
      result[event.id] = findNextGregorianDateForHijri(
        event.hijriDay,
        event.hijriMonth,
        baseDate,
      );
    };

    SLIDES.forEach(slide => cacheEventDate(slide.mainEvent));
    OTHER_EVENTS.forEach(cacheEventDate);

    return result;
  }, []);

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

  /* tek bir slide'ın içeriğini üret */
  const renderSlideContent = (slide: SlideConfig) => {
    const target = eventTargets[slide.mainEvent.id] ?? null;

    const remaining = formatRemaining(now, target, i18n.language);

    return (
      <View style={styles.slide}>
        {slide.id !== 'otherDays' && (
          <>
            <Text style={styles.slideTitle}>{t(slide.titleKey)}</Text>
            <Text style={styles.mainValue}>{remaining}</Text>
          </>
        )}

        {slide.descriptionKey && slide.id !== 'otherDays' && (
          <Text style={styles.description}>{t(slide.descriptionKey)}</Text>
        )}

        {slide.extraInfoKey && (
          <Text style={styles.extraInfo}>{t(slide.extraInfoKey)}</Text>
        )}

        {/* Hicrî yılbaşı / Aşure / Mevlid */}
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
