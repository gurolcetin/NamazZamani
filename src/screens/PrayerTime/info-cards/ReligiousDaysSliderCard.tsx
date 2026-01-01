import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
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
 * SLIDE YAPISI
 * ---------------------------------------------------- */
type HijriEvent = {
  id: string;
  hijriDay: number;
  hijriMonth: number;
};

type EventTargetDates = {
  upcoming: Date | null;
  previous: Date | null;
};

type SingleEventDisplay = {
  mainValue: string | null;
  miniDate: string | null;
  status: 'future' | 'past';
  eventDate: Date | null;
};

type SlideConfig = {
  id: string;
  mainEvent: HijriEvent;
  titleKey: string;
  descriptionKey?: string;
  rangeEndEvent?: HijriEvent;
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
    rangeEndEvent: { id: 'eidFitr', hijriDay: 1, hijriMonth: 10 },
  },
  {
    id: 'regaib',
    mainEvent: { id: 'regaib', hijriDay: 1, hijriMonth: 7 },
    titleKey: 'prayerTime.religiousDays.cards.regaib.title',
    descriptionKey: 'prayerTime.religiousDays.slides.ramadan.regaib',
  },
  {
    id: 'miraj',
    mainEvent: { id: 'miraj', hijriDay: 27, hijriMonth: 7 },
    titleKey: 'prayerTime.religiousDays.cards.miraj.title',
    descriptionKey: 'prayerTime.religiousDays.slides.ramadan.miraj',
  },
  {
    id: 'berat',
    mainEvent: { id: 'berat', hijriDay: 15, hijriMonth: 8 },
    titleKey: 'prayerTime.religiousDays.cards.berat.title',
    descriptionKey: 'prayerTime.religiousDays.slides.ramadan.berat',
  },
  {
    id: 'ramadan',
    mainEvent: { id: 'ramadanStart', hijriDay: 1, hijriMonth: 9 },
    titleKey: 'prayerTime.religiousDays.slides.ramadan.title',
    descriptionKey: 'prayerTime.religiousDays.slides.ramadan.description',
    rangeEndEvent: { id: 'eidFitr', hijriDay: 1, hijriMonth: 10 },
  },
  {
    id: 'qadr',
    mainEvent: { id: 'qadr', hijriDay: 27, hijriMonth: 9 },
    titleKey: 'prayerTime.religiousDays.cards.qadr.title',
    descriptionKey: 'prayerTime.religiousDays.slides.ramadan.kadir',
  },
  {
    id: 'eidFitr',
    mainEvent: { id: 'eidFitr', hijriDay: 1, hijriMonth: 10 },
    titleKey: 'prayerTime.religiousDays.slides.eidFitr.title',
    descriptionKey: 'prayerTime.religiousDays.slides.eidFitr.description',
  },
  {
    id: 'eidAdha',
    mainEvent: { id: 'eidAdha', hijriDay: 10, hijriMonth: 12 },
    titleKey: 'prayerTime.religiousDays.slides.eidAdha.title',
    descriptionKey: 'prayerTime.religiousDays.slides.eidAdha.description',
  },
  {
    id: 'hijriNewYear',
    mainEvent: { id: 'hijriNewYear', hijriDay: 1, hijriMonth: 1 },
    titleKey: 'prayerTime.religiousDays.other.hijriNewYear',
  },
  {
    id: 'ashura',
    mainEvent: { id: 'ashura', hijriDay: 10, hijriMonth: 1 },
    titleKey: 'prayerTime.religiousDays.other.ashura',
  },
  {
    id: 'mawlid',
    mainEvent: { id: 'mawlid', hijriDay: 12, hijriMonth: 3 },
    titleKey: 'prayerTime.religiousDays.other.mawlid',
  },
];

const FIRST_TARGET_YEAR = 2026;
const MAX_LOOKAHEAD_YEARS = 20;

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
    devRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      gap: 12,
    },
    devActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    devButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: 'rgba(148,163,184,0.12)',
    },
    devButtonText: {
      fontSize: 11 * fontScale,
      fontWeight: '600',
      color: colors.primary,
    },
    devPickerWrapper: {
      marginTop: 12,
      borderRadius: 12,
      overflow: 'hidden',
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
    rangeInfo: {
      fontSize: 12 * fontScale,
      color: colors.muted,
      marginBottom: 6,
    },
    emptyStateText: {
      fontSize: 13 * fontScale,
      color: colors.muted,
      textAlign: 'center',
      marginTop: 16,
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

const findPreviousGregorianDateForHijri = (
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
      if (cursor.getTime() > fromDate.getTime()) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      return cursor;
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return null;
};

const findGregorianDateForHijriInYear = (
  hijriDay: number,
  hijriMonth: number,
  year: number,
): Date | null => {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const cursor = new Date(start);

  while (cursor < end) {
    const h = convertMiladiDateToHicriDate(cursor);
    if (h.dayOfMonth === hijriDay && h.month === hijriMonth) {
      return new Date(cursor);
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

const findPreviousRegaibDate = (fromDate: Date): Date | null => {
  const normalized = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  );
  const cursor = new Date(normalized);
  cursor.setDate(cursor.getDate() + 40);

  for (let i = 0; i < 800; i++) {
    const hijri = convertMiladiDateToHicriDate(cursor);
    if (hijri.month === 7 && hijri.dayOfMonth === 1) {
      const startOfRajab = new Date(cursor);
      const desiredWeekday = 4;
      const offset = (desiredWeekday - startOfRajab.getDay() + 7) % 7;
      const regaibDate = new Date(startOfRajab);
      regaibDate.setDate(regaibDate.getDate() + offset);

      if (regaibDate.getTime() <= normalized.getTime()) {
        return regaibDate;
      }
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return null;
};

const findRegaibDateForYear = (year: number): Date | null => {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);
  const cursor = new Date(startOfYear);

  while (cursor < endOfYear) {
    const hijri = convertMiladiDateToHicriDate(cursor);
    if (hijri.month === 7 && hijri.dayOfMonth === 1) {
      const startOfRajab = new Date(cursor);
      const desiredWeekday = 4;
      const offset = (desiredWeekday - startOfRajab.getDay() + 7) % 7;
      const regaibDate = new Date(startOfRajab);
      regaibDate.setDate(regaibDate.getDate() + offset);

      if (
        regaibDate.getTime() >= startOfYear.getTime() &&
        regaibDate.getTime() < endOfYear.getTime()
      ) {
        return regaibDate;
      }

      break;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return null;
};

const getGregorianDateForEventInYear = (
  event: HijriEvent,
  year: number,
): Date | null => {
  if (event.id === 'regaib') {
    return findRegaibDateForYear(year);
  }
  return findGregorianDateForHijriInYear(
    event.hijriDay,
    event.hijriMonth,
    year,
  );
};

const determineTargetYear = (currentDay: Date): number => {
  const dayTime = currentDay.getTime();
  for (let offset = 0; offset < MAX_LOOKAHEAD_YEARS; offset++) {
    const year = FIRST_TARGET_YEAR + offset;
    const hasUpcoming = SLIDES.some(slide => {
      const date = getGregorianDateForEventInYear(slide.mainEvent, year);
      return date ? date.getTime() >= dayTime : false;
    });
    if (hasUpcoming) {
      return year;
    }
  }

  return FIRST_TARGET_YEAR;
};

const formatRemaining = (
  now: Date,
  target: Date | null,
  lang: string,
): string => {
  if (!target) return '-';

  const normalizedNow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const normalizedTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  if (normalizedNow.getTime() === normalizedTarget.getTime()) {
    return lang.startsWith('tr') ? 'Bugün' : 'Today';
  }

  const diff = normalizedTarget.getTime() - normalizedNow.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff <= oneDay) {
    return lang.startsWith('tr') ? 'Yarın' : 'Tomorrow';
  }

  const isTurkish = lang.startsWith('tr');

  let months =
    (normalizedTarget.getFullYear() - normalizedNow.getFullYear()) * 12 +
    (normalizedTarget.getMonth() - normalizedNow.getMonth());
  let anchor = new Date(normalizedNow);
  anchor.setMonth(anchor.getMonth() + months);

  if (anchor.getTime() > normalizedTarget.getTime()) {
    months -= 1;
    anchor = new Date(normalizedNow);
    anchor.setMonth(anchor.getMonth() + months);
  }

  const remainingDays = Math.max(
    0,
    Math.floor((normalizedTarget.getTime() - anchor.getTime()) / oneDay),
  );

  const parts: string[] = [];
  if (months > 0) {
    const monthText = isTurkish
      ? `${months} ay`
      : months === 1
      ? '1 month'
      : `${months} months`;
    parts.push(monthText);
  }

  if (remainingDays > 0 || months === 0) {
    const dayText = isTurkish
      ? `${remainingDays} gün`
      : remainingDays === 1
      ? '1 day'
      : `${remainingDays} days`;
    parts.push(dayText);
  }

  return parts.join(' ');
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
  const [testDate, setTestDate] = useState<Date | null>(null);
  const [showTestDatePicker, setShowTestDatePicker] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );
  const scrollRef = useRef<ScrollView>(null);

  const defaultStartOfToday = useMemo(
    () => dateFromYMD(currentDateKey),
    [currentDateKey],
  );

  const startOfActiveDay = useMemo(() => {
    if (!testDate) {
      return defaultStartOfToday;
    }
    return new Date(
      testDate.getFullYear(),
      testDate.getMonth(),
      testDate.getDate(),
    );
  }, [defaultStartOfToday, testDate]);

  const targetYear = useMemo(
    () => determineTargetYear(startOfActiveDay),
    [startOfActiveDay],
  );

  const isCustomTestDateActive = Boolean(testDate);

  /* her saniye geri sayımı güncelle */
  useEffect(() => {
    if (isCustomTestDateActive && testDate) {
      setNow(testDate);
      return;
    }

    const updateNow = () => setNow(new Date());
    updateNow();
    const id = setInterval(updateNow, 1000);
    return () => clearInterval(id);
  }, [isCustomTestDateActive, testDate]);

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  function dateFromYMD(ymd: string) {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d); // LOCAL midnight
  }

  /**
   * Hicrî günlerin miladî karşılıklarını günlük olarak hesaplayıp sakla.
   * currentDateKey değiştiğinde (cihaz tarihi değişince) yeniden hesaplanır.
   */
  const eventTargets = useMemo(() => {
    const baseDate = new Date(startOfActiveDay);
    const result: Record<string, EventTargetDates> = {};

    const cacheEventDate = (event: HijriEvent) => {
      if (result[event.id]) {
        return;
      }
      const targetYearDate = getGregorianDateForEventInYear(
        event,
        targetYear,
      );
      if (targetYearDate) {
        result[event.id] = {
          upcoming: targetYearDate,
          previous: targetYearDate,
        };
        return;
      }
      result[event.id] = {
        upcoming:
          event.id === 'regaib'
            ? findUpcomingRegaibDate(baseDate)
            : findNextGregorianDateForHijri(
                event.hijriDay,
                event.hijriMonth,
                baseDate,
              ),
        previous:
          event.id === 'regaib'
            ? findPreviousRegaibDate(baseDate)
            : findPreviousGregorianDateForHijri(
                event.hijriDay,
                event.hijriMonth,
                baseDate,
              ),
      };
    };

    SLIDES.forEach(slide => {
      cacheEventDate(slide.mainEvent);
      if (slide.rangeEndEvent) {
        cacheEventDate(slide.rangeEndEvent);
      }
    });

    return result;
  }, [startOfActiveDay, targetYear]);

  const orderedSlides = useMemo(() => {
    const nowTime = now.getTime();

    const withDates = SLIDES.map(slide => {
      const info = eventTargets[slide.mainEvent.id];
      const targetDate = info?.upcoming ?? info?.previous ?? null;
      return { slide, targetDate };
    });

    const futureOnly = withDates.filter(({ targetDate }) => {
      if (!targetDate) {
        return false;
      }
      return targetDate.getTime() >= startOfActiveDay.getTime();
    });

    futureOnly.sort((a, b) => {
      const aFuture =
        a.targetDate !== null && a.targetDate.getTime() >= nowTime;
      const bFuture =
        b.targetDate !== null && b.targetDate.getTime() >= nowTime;

      if (aFuture !== bFuture) {
        return aFuture ? -1 : 1;
      }

      if (!a.targetDate && !b.targetDate) {
        return 0;
      }
      if (!a.targetDate) {
        return 1;
      }
      if (!b.targetDate) {
        return -1;
      }

      return a.targetDate.getTime() - b.targetDate.getTime();
    });

    return futureOnly.map(item => item.slide);
  }, [eventTargets, now, startOfActiveDay]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setSlideWidth(e.nativeEvent.layout.width);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!slideWidth) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(index);
  };

  useEffect(() => {
    if (!slideWidth) return;
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [slideWidth, startOfActiveDay, orderedSlides.length]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return date.toLocaleDateString(dateLocale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getEventDateInfo = (event: HijriEvent): EventTargetDates => {
    return eventTargets[event.id] ?? { upcoming: null, previous: null };
  };

  const buildSingleEventDisplay = (
    event: HijriEvent,
  ): SingleEventDisplay => {
    const info = getEventDateInfo(event);
    const targetDate = info.upcoming ?? info.previous ?? null;
    const inFuture = targetDate
      ? targetDate.getTime() >= startOfActiveDay.getTime()
      : false;

    if (inFuture && targetDate) {
      const countdown = formatRemaining(now, targetDate, i18n.language);

      return {
        status: 'future',
        mainValue: countdown,
        miniDate: formatDate(targetDate),
        eventDate: targetDate,
      };
    }

    const dateToShow = targetDate;
    const formattedDate = dateToShow ? formatDate(dateToShow) : null;
    return {
      status: 'past',
      mainValue: formattedDate ?? '-',
      miniDate: formattedDate,
      eventDate: dateToShow,
    };
  };

  const renderSlideContent = (slide: SlideConfig) => {
    const display = buildSingleEventDisplay(slide.mainEvent);
    const mainValue = display.mainValue;
    const rangeInfoText = (() => {
      if (!slide.rangeEndEvent) {
        return null;
      }
      const startInfo = getEventDateInfo(slide.mainEvent);
      const endInfo = getEventDateInfo(slide.rangeEndEvent);
      const startDate = startInfo.upcoming ?? startInfo.previous;
      const endDate = endInfo.upcoming ?? endInfo.previous;
      if (!startDate || !endDate) {
        return null;
      }
      return `${formatDate(startDate)} – ${formatDate(endDate)}`;
    })();
    const shouldShowMiniDate =
      !rangeInfoText && display.status === 'future';
    const miniDate = shouldShowMiniDate ? display.miniDate : null;

    return (
      <View style={styles.slide}>
        <Text style={styles.slideTitle}>{t(slide.titleKey)}</Text>
        {mainValue ? <Text style={styles.mainValue}>{mainValue}</Text> : null}
        {miniDate ? <Text style={styles.miniDate}>{miniDate}</Text> : null}
        {rangeInfoText ? (
          <Text style={styles.rangeInfo}>{rangeInfoText}</Text>
        ) : null}
        {slide.descriptionKey && (
          <Text style={styles.description}>{t(slide.descriptionKey)}</Text>
        )}
      </View>
    );
  };

  const handleApplyTestDate = (picked: Date | undefined | null) => {
    if (picked) {
      setTestDate(picked);
    }
  };

  const handleTestDateChange = (event: any, picked?: Date) => {
    if (Platform.OS === 'android') {
      if (event?.type === 'dismissed') {
        setShowTestDatePicker(false);
        return;
      }
      setShowTestDatePicker(false);
      handleApplyTestDate(picked);
      return;
    }

    handleApplyTestDate(picked);
  };

  const toggleTestDatePicker = () =>
    setShowTestDatePicker(prev => !prev);
  const closeTestDatePicker = () => setShowTestDatePicker(false);
  const clearTestDate = () => {
    setTestDate(null);
    closeTestDatePicker();
  };

  const formattedActiveDate = formatDate(startOfActiveDay);
  const hasSlides = orderedSlides.length > 0;

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>
            {t('prayerTime.religiousDays.title')}
          </Text>
          {__DEV__ && (
            <View style={styles.devRow}>
              <Text style={styles.subtitle}>{formattedActiveDate}</Text>
              <View style={styles.devActions}>
                <Pressable
                  onPress={toggleTestDatePicker}
                  style={styles.devButton}
                >
                  <Text style={styles.devButtonText}>
                    {t('monthlyCalendar.changeDate')}
                  </Text>
                </Pressable>
                {isCustomTestDateActive && (
                  <Pressable onPress={clearTestDate} style={styles.devButton}>
                    <Text style={styles.devButtonText}>
                      {t('monthlyCalendar.today')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {__DEV__ && showTestDatePicker && (
        <View style={styles.devPickerWrapper}>
          <DateTimePicker
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            mode="date"
            value={testDate ?? startOfActiveDay}
            minimumDate={new Date(1900, 0, 1)}
            accentColor={currentTheme.primary}
            locale={dateLocale}
            onChange={handleTestDateChange}
          />
        </View>
      )}

      {hasSlides ? (
        <>
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
                {orderedSlides.map(slide => (
                  <View key={slide.id} style={{ width: slideWidth }}>
                    {renderSlideContent(slide)}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* SLIDER DOTS */}
          <View style={styles.dotsRow}>
            {orderedSlides.map((slide, idx) => (
              <View
                key={slide.id}
                style={[styles.dot, idx === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.emptyStateText}>
          {t('prayerTime.religiousDays.empty')}
        </Text>
      )}
    </View>
  );
};

export const ReligiousDaysSliderCard = memo(ReligiousDaysSliderCardComponent);
