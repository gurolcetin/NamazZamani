import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Platform,
  ListRenderItemInfo,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../../../libs/core/providers';
import {
  BottomTabScreenViewContainer,
  PrayerTimeSmallCard,
  Icons,
  Icon,
} from '../../../../libs/components';
import { fetchMonthlyPrayerTimesByCoords, type PrayerTimings } from './api';
import { getCurrentPosition, requestLocationPermission } from '../permission';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  LanguageLocaleKeys,
  LanguagePrefix,
} from '../../../../libs/common/constants';
import { selectActiveResolved } from '../../../../libs/redux/reducers/location';
import type { PrayerTimeKey, SmallCard } from '../../../../libs/common/types';
import MonthlyCalendarSkeleton from './montly-calendar-skeleton';
import { FontScaleOption } from '../../../../libs/common/enums';
import { getFontScaleMultiplier } from '../../../../libs/core/helpers';

type Key = PrayerTimeKey; // aynı tip
const PRAYER_ORDER: PrayerTimeKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

const PRAYER_NAME_KEYS: Record<Key, string> = {
  Fajr: 'prayerNames.Fajr',
  Sunrise: 'prayerNames.Sunrise',
  Dhuhr: 'prayerNames.Dhuhr',
  Asr: 'prayerNames.Asr',
  Maghrib: 'prayerNames.Maghrib',
  Isha: 'prayerNames.Isha',
};

function daysInMonth(y: number, m1to12: number) {
  return new Date(y, m1to12, 0).getDate();
}

// ----- yardımcılar (aktif vakti hesaplamak için) ----------------------------
function toTodayDate(hhmm: string, base = new Date()): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}
function getCurrentKeyForDay(
  t: PrayerTimings,
  date: Date,
): PrayerTimeKey | null {
  // sadece "bugün" için anlamlı; diğer günlerde highlight yapmayacağız
  const now = new Date();
  if (
    now.getFullYear() !== date.getFullYear() ||
    now.getMonth() !== date.getMonth() ||
    now.getDate() !== date.getDate()
  ) {
    return null;
  }
  const seq = PRAYER_ORDER.map(key => ({
    key,
    date: toTodayDate(t[key], now),
  }));
  // now hangi aralıkta? prev (current) olacak
  for (let i = 0; i < seq.length; i++) {
    if (now < seq[i].date) {
      const prev = i === 0 ? seq[seq.length - 1] : seq[i - 1];
      return prev.key;
    }
  }
  // günü geçtiyse sonuncu current sayılır
  return seq[seq.length - 1].key;
}

// ----------------------------------------------------------------------------

export default function MonthlyCalendar() {
  const { currentTheme } = useTheme();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );
  const activeResolved = useSelector(selectActiveResolved);
  const { t, i18n } = useTranslation();
  const applicationSettings = useSelector(
    (state: any) => state.applicationSettings,
  );
  const fontScalePreference =
    applicationSettings?.fontScale ?? FontScaleOption.MEDIUM;
  const fontScaleMultiplier = useMemo(
    () => getFontScaleMultiplier(fontScalePreference),
    [fontScalePreference],
  );
  const styles = useMemo(
    () => createStyles(fontScaleMultiplier),
    [fontScaleMultiplier],
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

  const [loading, setLoading] = useState(true);

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  // Takvim state’leri
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1..12
  const [selectedDay, setSelectedDay] = useState(now.getDate()); // 1..31
  const selectedDate = useMemo(
    () => new Date(year, month - 1, selectedDay),
    [year, month, selectedDay],
  );

  // Aylık vakit verisi
  const [monthTimings, setMonthTimings] = useState<PrayerTimings[] | null>(
    null,
  );

  // Ay fetch spinner
  const [isMonthLoading, setIsMonthLoading] = useState(false);

  // Android için dialog gösterme
  const [showPicker, setShowPicker] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      let latitude: number | null = null;
      let longitude: number | null = null;
      if ('type' in activeResolved && activeResolved.type === 'device') {
        const permissionResult = await requestLocationPermission();
        if (permissionResult !== 'granted') return;
        const pos = await getCurrentPosition();
        latitude = pos.latitude;
        longitude = pos.longitude;
      } else {
        latitude = activeResolved.latitude;
        longitude = activeResolved.longitude;
      }
      if (latitude != null && longitude != null) {
        setCoords({ lat: latitude, lon: longitude });
      }
    } finally {
      setLoading(false);
    }
  }, [activeResolved]);

  useEffect(() => {
    load();
  }, [load]);

  // Ay verisini yükle (koordinat veya ay değişirse)
  useEffect(() => {
    (async () => {
      if (!coords) return;
      setMonthTimings(null);
      setIsMonthLoading(true);
      try {
        const data = await fetchMonthlyPrayerTimesByCoords(
          year,
          month,
          coords.lat,
          coords.lon,
          13,
          undefined,
          activeResolved.type === 'device' ? undefined : activeResolved.label,
        );
        setMonthTimings(data);
        const dim = daysInMonth(year, month);
        if (selectedDay > dim) setSelectedDay(dim);
      } finally {
        setIsMonthLoading(false);
      }
    })();
    // selectedDay burada dependency değil: sadece ay/koordinat değişince fetch
  }, [activeResolved, coords, year, month, selectedDay]);
  // PrayerTimeSmallCard için renderItem
  const renderSmallCard = useCallback(
    ({ item, index }: ListRenderItemInfo<SmallCard>) => (
      <PrayerTimeSmallCard item={item} index={index} />
    ),
    [],
  );
  // Günün vakitlerini SmallCard[]’a çevir
  const smallCards: SmallCard[] = useMemo(() => {
    if (!monthTimings) return [];
    const dim = daysInMonth(year, month);
    const d = Math.min(selectedDay, dim);
    const t = monthTimings[d - 1];
    if (!t) return [];

    const currentKey = getCurrentKeyForDay(t, selectedDate);
    const order = PRAYER_ORDER;

    return order.map<SmallCard>(k => ({
      key: k,
      label: prayerLabels[k] ?? k,
      time: t[k],
      isCurrent: currentKey ? k === currentKey : false,
      // bu ekranda miniLeft/notifications ihtiyari:
      // miniLeft: undefined,
      // notif: k === 'Fajr' || k === 'Maghrib',
    }));
  }, [monthTimings, year, month, selectedDay, selectedDate, prayerLabels]);

  const shouldShowSkeleton = isMonthLoading;

  if (loading && !coords) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator color={currentTheme.primary} />
        <Text style={styles.loadingText}>
          {t('monthlyCalendar.loadingLocation')}
        </Text>
      </View>
    );
  }

  // Bugün butonu
  const handleToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
    setSelectedDay(t.getDate());
  };

  // Ortak tarih değiştirici (iOS inline + Android dialog sonrası)
  const applyPickedDate = (picked: Date | undefined | null) => {
    const next = picked ?? selectedDate;
    const y = next.getFullYear();
    const m = next.getMonth() + 1;
    const d = next.getDate();
    setYear(y);
    setMonth(m);
    setSelectedDay(d);
  };

  return (
    <BottomTabScreenViewContainer
      showSkeleton={shouldShowSkeleton}
      skeletonContent={<MonthlyCalendarSkeleton />}
    >
      <View style={styles.contentWrapper}>
        {/* Beyaz Card içinde Takvim başlık + gövde */}
        <View style={styles.cardWrap}>
          <View
            style={[
              styles.cardHeader,
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
          >
            {/* Sol: Android'te Tarih Değiştir butonu, iOS'ta boş tutucu */}
            {Platform.OS === 'android' ? (
              <Pressable
                onPress={() => setShowPicker(true)}
                style={styles.dateBtn}
                disabled={isMonthLoading}
              >
                <Icon
                  name="calendar-multiselect-outline"
                  type={Icons.MaterialDesignIcons}
                  size={14}
                  color={currentTheme.primary}
                />
                <Text style={styles.dateBtnText}>
                  {t('monthlyCalendar.changeDate')}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.headerSpacer} />
            )}

            {/* Orta: seçili gün bilgisi */}
            <View style={styles.headerTitleWrap}>
              <Text
                style={[styles.cardTitle, { color: currentTheme.textColor }]}
              >
                {selectedDate.toLocaleDateString(dateLocale, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Sağ: Bugün */}
            <Pressable
              onPress={handleToday}
              style={styles.todayBtn}
              disabled={isMonthLoading}
            >
              <Icon
                type={Icons.MaterialDesignIcons}
                name="refresh"
                size={14}
                color={currentTheme.textColor}
              />
              <Text style={styles.todayBtnText}>
                {t('monthlyCalendar.today')}
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.cardBody,
              {
                paddingHorizontal: Platform.OS === 'android' ? 0 : 6,
                paddingVertical: Platform.OS === 'android' ? 0 : 6,
                backgroundColor: currentTheme.cardViewBackgroundColor,
              },
            ]}
          >
            {/* iOS: inline picker */}
            {Platform.OS === 'ios' && (
              <DateTimePicker
                display="inline"
                mode="date"
                value={selectedDate}
                themeVariant={applicationTheme.theme}
                locale={dateLocale}
                minimumDate={new Date(1900, 0, 1)}
                accentColor={currentTheme.primary}
                onChange={(_, picked) => {
                  applyPickedDate(picked);
                }}
              />
            )}

            {/* Ay verisi yüklenirken overlay */}
            {isMonthLoading && monthTimings && (
              <View style={styles.pickerOverlay}>
                <ActivityIndicator color={currentTheme.primary} />
                <Text style={styles.overlayText}>
                  {t('monthlyCalendar.dataLoading')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Günün Vakitleri – PrayerTimeSmallCard ile 2 sütun */}
        <View style={styles.dailyTimesHeader}>
          <Text style={[styles.sectionTitle, { color: '#000' }]}>
            {t('monthlyCalendar.dailyTimes')}
          </Text>
        </View>

        {smallCards.length === 0 ? (
          shouldShowSkeleton ? null : (
            <View style={[styles.center, { paddingVertical: 12 }]}>
              <ActivityIndicator color={currentTheme.primary} />
              <Text style={styles.timesLoadingText}>
                {t('monthlyCalendar.timesLoading')}
              </Text>
            </View>
          )
        ) : (
          <FlatList
            data={smallCards}
            numColumns={2}
            keyExtractor={i => i.key}
            renderItem={renderSmallCard}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.listColumnWrapper}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            initialNumToRender={6}
            windowSize={7}
          />
        )}

        {/* ANDROID: dialog tipi DatePicker tetikleyici */}
        {Platform.OS === 'android' && showPicker && (
          <DateTimePicker
            display="default"
            mode="date"
            value={selectedDate}
            accentColor={currentTheme.primary}
            locale={dateLocale}
            minimumDate={new Date(1900, 0, 1)}
            onChange={(event: any, picked?: Date) => {
              if (event?.type === 'dismissed') {
                setShowPicker(false);
                return;
              }
              applyPickedDate(picked);
              setShowPicker(false);
            }}
          />
        )}
      </View>
    </BottomTabScreenViewContainer>
  );
}

const createStyles = (fontScaleMultiplier: number) => StyleSheet.create({
  contentWrapper: {
    flex: 1,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8 },

  /* --- Beyaz Card Takvim --- */
  cardWrap: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginTop: 10,
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16 * fontScaleMultiplier,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  cardBody: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 1,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },

  // Sol buton (Android)
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  dateBtnText: {
    fontSize: 13 * fontScaleMultiplier,
    fontWeight: '800',
    color: '#111',
  },

  // Sağ: Bugün
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  todayBtnText: {
    fontSize: 13 * fontScaleMultiplier,
    fontWeight: '800',
    color: '#111',
  },

  // Overlay spinner
  pickerOverlay: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 6,
    bottom: 6,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  overlayText: { marginTop: 6, color: '#111', fontWeight: '600', opacity: 0.8 },

  sectionTitle: { fontSize: 16 * fontScaleMultiplier, fontWeight: '900' },
  dailyTimesHeader: { paddingHorizontal: 16, paddingTop: 10 },
  timesLoadingText: { marginTop: 6, opacity: 0.8 },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  listColumnWrapper: { justifyContent: 'space-between' },
});
