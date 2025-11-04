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
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { useTheme } from '../../../../libs/core/providers';
import {
  ScreenViewContainer,
  PrayerTimeSmallCard,
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

type Key = PrayerTimeKey; // aynı tip
const LABELS_TR: Record<Key, string> = {
  Fajr: 'İmsak',
  Sunrise: 'Güneş',
  Dhuhr: 'Öğle',
  Asr: 'İkindi',
  Maghrib: 'Akşam',
  Isha: 'Yatsı',
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
function buildSequence(t: PrayerTimings, base = new Date()) {
  const order: PrayerTimeKey[] = [
    'Fajr',
    'Sunrise',
    'Dhuhr',
    'Asr',
    'Maghrib',
    'Isha',
  ];
  return order.map(k => ({
    key: k,
    label: LABELS_TR[k],
    time: t[k],
    date: toTodayDate(t[k], base),
  }));
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
  const seq = buildSequence(t, now);
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
  const { i18n } = useTranslation();

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

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
        const ok = await requestLocationPermission();
        if (!ok) return;
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
        );
        setMonthTimings(data);
        const dim = daysInMonth(year, month);
        if (selectedDay > dim) setSelectedDay(dim);
      } finally {
        setIsMonthLoading(false);
      }
    })();
    // selectedDay burada dependency değil: sadece ay/koordinat değişince fetch
  }, [coords, year, month, selectedDay]);
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
    const order: PrayerTimeKey[] = [
      'Fajr',
      'Sunrise',
      'Dhuhr',
      'Asr',
      'Maghrib',
      'Isha',
    ];

    return order.map<SmallCard>(k => ({
      key: k,
      label: LABELS_TR[k],
      time: t[k],
      isCurrent: currentKey ? k === currentKey : false,
      // bu ekranda miniLeft/notifications ihtiyari:
      // miniLeft: undefined,
      // notif: k === 'Fajr' || k === 'Maghrib',
    }));
  }, [monthTimings, year, month, selectedDay, selectedDate]);

  if (loading && !coords) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Konum alınıyor…</Text>
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
    <ScreenViewContainer>
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
              <Ionicons
                name="calendar-outline"
                size={14}
                color={currentTheme.textColor}
              />
              <Text style={styles.dateBtnText}>Tarih Değiştir</Text>
            </Pressable>
          ) : (
            <View style={{ width: 1 }} />
          )}

          {/* Orta: seçili gün bilgisi */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.cardTitle, { color: currentTheme.textColor }]}>
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
            <Ionicons name="refresh-outline" size={14} color="#111" />
            <Text style={styles.todayBtnText}>Bugün</Text>
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
          {isMonthLoading && (
            <View style={styles.pickerOverlay}>
              <ActivityIndicator />
              <Text style={styles.overlayText}>Veriler yükleniyor…</Text>
            </View>
          )}
        </View>
      </View>

      {/* Günün Vakitleri – PrayerTimeSmallCard ile 2 sütun */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <Text style={[styles.sectionTitle, { color: '#000' }]}>
          Günün Vakitleri
        </Text>
      </View>

      {smallCards.length === 0 ? (
        <View style={[styles.center, { paddingVertical: 12 }]}>
          <ActivityIndicator />
          <Text style={{ marginTop: 6, opacity: 0.8 }}>
            Vakitler yükleniyor…
          </Text>
        </View>
      ) : (
        <FlatList
          data={smallCards}
          numColumns={2}
          keyExtractor={i => i.key}
          renderItem={renderSmallCard}
          contentContainerStyle={{
            paddingBottom: 24,
            paddingHorizontal: 16,
          }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
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
    </ScreenViewContainer>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },

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
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  cardBody: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
  dateBtnText: { fontSize: 13, fontWeight: '800', color: '#111' },

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
  todayBtnText: { fontSize: 13, fontWeight: '800', color: '#111' },

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

  sectionTitle: { fontSize: 16, fontWeight: '900' },
});
