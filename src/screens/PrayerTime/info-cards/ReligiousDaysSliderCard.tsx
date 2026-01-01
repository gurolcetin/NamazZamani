import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { getFontScaleMultiplier } from '../../../../libs/core/helpers';
import type { RootState } from '../../../../libs/redux/store';
import {
  LanguageLocaleKeys,
  LanguagePrefix,
} from '../../../../libs/common/constants';

const RELIGIOUS_DAYS_URL =
  'https://gurolcetin.github.io/namaz-zamani-public-files/religious-days.json';

type RemoteReligiousDay = {
  id: string;
  name: string;
  dates: string[];
};

type ReligiousDaysResponse = {
  diyanet?: RemoteReligiousDay[];
};

type ReligiousDayInstance = {
  instanceId: string;
  id: string;
  name: string;
  sanitizedName: string;
  date: Date;
};

type EventRule = {
  pattern: RegExp;
  translationKey: string;
  stripParenthetical?: boolean;
};

const EVENT_RULES: EventRule[] = [
  { pattern: /^mirac-/, translationKey: 'mirac' },
  { pattern: /^berat-/, translationKey: 'berat' },
  { pattern: /^ramazan-baslangic-/, translationKey: 'ramazanBaslangic' },
  { pattern: /^kadir-/, translationKey: 'kadir' },
  {
    pattern: /^ramazan-bayram-1-/,
    translationKey: 'ramazanBayram',
    stripParenthetical: true,
  },
  {
    pattern: /^kurban-1-/,
    translationKey: 'kurbanBayram',
    stripParenthetical: true,
  },
  { pattern: /^hicri-yilbasi-/, translationKey: 'hicriYilbasi' },
  { pattern: /^asure-/, translationKey: 'asure' },
  { pattern: /^mevlid-/, translationKey: 'mevlid' },
  { pattern: /^uc-aylar-baslangic-/, translationKey: 'ucAylarBaslangic' },
  { pattern: /^regaib-/, translationKey: 'regaib' },
];

const isAllowedEvent = (id: string) =>
  EVENT_RULES.some(rule => rule.pattern.test(id));

const getEventRule = (id: string) =>
  EVENT_RULES.find(rule => rule.pattern.test(id));

const sanitizeEventName = (id: string, name: string) => {
  const rule = getEventRule(id);
  if (rule?.stripParenthetical) {
    return name.replace(/\s*\(.*?\)\s*/g, '').trim();
  }
  return name;
};

const parseLocalDate = (value: string): Date | null => {
  const [year, month, day] = value.split('-').map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const mapApiResponseToInstances = (
  response: ReligiousDaysResponse | null,
): ReligiousDayInstance[] => {
  if (!response?.diyanet) {
    return [];
  }

  const instances: ReligiousDayInstance[] = [];
  response.diyanet.forEach(item => {
    if (!isAllowedEvent(item.id)) {
      return;
    }
    item.dates.forEach(dateStr => {
      const parsedDate = parseLocalDate(dateStr);
      if (!parsedDate) {
        return;
      }
      instances.push({
        instanceId: `${item.id}-${dateStr}`,
        id: item.id,
        name: item.name,
        sanitizedName: sanitizeEventName(item.id, item.name),
        date: parsedDate,
      });
    });
  });

  instances.sort((a, b) => a.date.getTime() - b.date.getTime());
  return instances;
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

const dateFromYMD = (ymd: string): Date => {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

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
    statusRow: {
      marginTop: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    statusButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: 'rgba(148,163,184,0.12)',
    },
    statusButtonText: {
      fontSize: 13 * fontScale,
      fontWeight: '600',
      color: colors.primary,
    },
  });

type Props = {
  currentDateKey: string;
};

const ReligiousDaysSliderCardComponent: React.FC<Props> = ({
  currentDateKey,
}) => {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language ?? LanguagePrefix.TURKISH;

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

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [now, setNow] = useState(new Date());
  const [testDate, setTestDate] = useState<Date | null>(null);
  const [showTestDatePicker, setShowTestDatePicker] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );
  const [religiousDays, setReligiousDays] = useState<ReligiousDayInstance[]>(
    [],
  );
  const [isLoadingDays, setIsLoadingDays] = useState(true);
  const [hasFetchError, setHasFetchError] = useState(false);
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

  const isCustomTestDateActive = Boolean(testDate);

  const loadReligiousDays = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }
    setIsLoadingDays(true);
    setHasFetchError(false);
    try {
      const response = await fetch(RELIGIOUS_DAYS_URL);
      if (!response.ok) {
        throw new Error('Failed to load');
      }
      const json = (await response.json()) as ReligiousDaysResponse;
      if (!isMountedRef.current) {
        return;
      }
      setReligiousDays(mapApiResponseToInstances(json));
    } catch {
      if (!isMountedRef.current) {
        return;
      }
      setHasFetchError(true);
      setReligiousDays([]);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingDays(false);
      }
    }
  }, []);

  useEffect(() => {
    loadReligiousDays();
  }, [loadReligiousDays]);

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
    setDateLocale(currentLanguage);
  }, [currentLanguage]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setSlideWidth(e.nativeEvent.layout.width);
  };

  const getDisplayName = useCallback(
    (event: ReligiousDayInstance) => {
      const rule = getEventRule(event.id);
      if (rule?.translationKey) {
        const translationKey = `prayerTime.religiousDays.eventNames.${rule.translationKey}`;
        const translated = t(translationKey);
        if (translated && translated !== translationKey) {
          return translated;
        }
      }
      return event.sanitizedName;
    },
    [t],
  );

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!slideWidth) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(index);
  };

  useEffect(() => {
    if (!slideWidth) return;
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [slideWidth, startOfActiveDay, religiousDays.length]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return date.toLocaleDateString(dateLocale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const upcomingEvents = useMemo(() => {
    const startTime = startOfActiveDay.getTime();
    const targetYear = startOfActiveDay.getFullYear();
    return religiousDays.filter(event => {
      return (
        event.date.getFullYear() === targetYear &&
        event.date.getTime() >= startTime
      );
    });
  }, [religiousDays, startOfActiveDay]);

  const renderEventSlide = (event: ReligiousDayInstance) => {
    const countdown = formatRemaining(now, event.date, currentLanguage);
    const displayDate = formatDate(event.date);
    const title = getDisplayName(event);

    return (
      <View style={styles.slide}>
        <Text style={styles.slideTitle}>{title}</Text>
        <Text style={styles.mainValue}>{countdown}</Text>
        <Text style={styles.miniDate}>{displayDate}</Text>
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

  const toggleTestDatePicker = () => setShowTestDatePicker(prev => !prev);
  const closeTestDatePicker = () => setShowTestDatePicker(false);
  const clearTestDate = () => {
    setTestDate(null);
    closeTestDatePicker();
  };

  const handleRetryFetch = () => {
    if (!isLoadingDays) {
      loadReligiousDays();
    }
  };

  const formattedActiveDate = formatDate(startOfActiveDay);
  const hasSlides = upcomingEvents.length > 0;

  let content = null;
  if (isLoadingDays) {
    content = (
      <Text style={styles.emptyStateText}>
        {t('prayerTime.religiousDays.loading')}
      </Text>
    );
  } else if (hasFetchError) {
    content = (
      <View style={styles.statusRow}>
        <Text style={styles.emptyStateText}>
          {t('prayerTime.religiousDays.error')}
        </Text>
        <Pressable onPress={handleRetryFetch} style={styles.statusButton}>
          <Text style={styles.statusButtonText}>
            {t('prayerTime.religiousDays.retry')}
          </Text>
        </Pressable>
      </View>
    );
  } else if (hasSlides) {
    content = (
      <>
        <View onLayout={handleLayout} style={styles.sliderContainer}>
          {slideWidth > 0 && (
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScrollEnd}
            >
              {upcomingEvents.map(event => (
                <View key={event.instanceId} style={{ width: slideWidth }}>
                  {renderEventSlide(event)}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.dotsRow}>
          {upcomingEvents.map((event, idx) => (
            <View
              key={event.instanceId}
              style={[styles.dot, idx === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      </>
    );
  } else {
    content = (
      <Text style={styles.emptyStateText}>
        {t('prayerTime.religiousDays.empty')}
      </Text>
    );
  }

  return (
    <View style={styles.card}>
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

      {content}
    </View>
  );
};

export const ReligiousDaysSliderCard = memo(ReligiousDaysSliderCardComponent);
