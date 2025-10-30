import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { useTheme } from '../../../../libs/core/providers';
import { ScreenViewContainer } from '../../../../libs/components';
import { fetchMonthlyPrayerTimesByCoords, type PrayerTimings } from './api';
import {
  getCurrentPosition,
  requestLocationPermission,
} from '../permission';
import { getUTCLabel, reverseGeocode } from '../reverse-geocode';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  LanguageLocaleKeys,
  LanguagePrefix,
} from '../../../../libs/common/constants';

type Key = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
const LABELS_TR: Record<Key, string> = {
  Fajr: 'İmsak',
  Sunrise: 'Güneş',
  Dhuhr: 'Öğle',
  Asr: 'İkindi',
  Maghrib: 'Akşam',
  Isha: 'Yatsı',
};
const ICONS: Record<Key, string> = {
  Fajr: 'moon-outline',
  Sunrise: 'sunny-outline',
  Dhuhr: 'sunny',
  Asr: 'partly-sunny-outline',
  Maghrib: 'cloudy-night-outline',
  Isha: 'moon',
};

function daysInMonth(y: number, m1to12: number) {
  return new Date(y, m1to12, 0).getDate();
}

export default function MonthlyCalendar() {
  const { currentTheme } = useTheme();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );
  const { i18n } = useTranslation();

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState('Konum alınıyor…');
  const [utcLabel, setUtcLabel] = useState(getUTCLabel());

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

  // 🔹 EKLENDİ: Aylık fetch spinner state'i
  const [isMonthLoading, setIsMonthLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const ok = await requestLocationPermission();
      if (!ok) return;
      const { latitude, longitude } = await getCurrentPosition();
      setCoords({ lat: latitude, lon: longitude });
      try {
        const label = await reverseGeocode(latitude, longitude);
        setLocationLabel(label);
      } catch {
        setLocationLabel('Konum bulunamadı');
      }
      setUtcLabel(getUTCLabel());
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Ay verisini yükle (koordinat veya ay değişirse)
  useEffect(() => {
    (async () => {
      if (!coords) return;
      setMonthTimings(null);
      setIsMonthLoading(true); // <-- EKLENDİ
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
        setIsMonthLoading(false); // <-- EKLENDİ
      }
    })();
  }, [coords, year, month, selectedDay]);

  // Gün seçilince o güne ait vakitler
  const dim = daysInMonth(year, month);
  const selectedTimings: PrayerTimings | null = useMemo(() => {
    if (!monthTimings) return null;
    const d = Math.min(selectedDay, dim);
    return monthTimings[d - 1] || null;
  }, [monthTimings, selectedDay, dim]);

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

  return (
    <ScreenViewContainer>
      {/* Üst bar */}
      <View style={styles.headerTop}>
        <Pressable
          style={[
            styles.cityBtn,
            { backgroundColor: currentTheme.inputBackgroundColor },
          ]}
        >
          <Ionicons name="location" size={16} color={currentTheme.textColor} />
          <Text style={[styles.cityText, { color: currentTheme.textColor }]}>
            {locationLabel} • {utcLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={currentTheme.textColor}
          />
        </Pressable>
        <View
          style={[
            styles.roundIcon,
            { backgroundColor: currentTheme.inputBackgroundColor },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={currentTheme.textColor}
          />
        </View>
      </View>

      {/* Beyaz Card içinde orijinal iOS inline DateTimePicker */}
      <View style={styles.cardWrap}>
        <View style={styles.cardHeader}>
          {/* 🔹 Seçili gün bilgisi */}
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.cardTitle}>
              {selectedDate.toLocaleDateString(dateLocale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Sağda "Bugün" butonu */}
          <Pressable
            onPress={handleToday}
            style={styles.todayBtn}
            disabled={isMonthLoading}
          >
            <Ionicons name="refresh-outline" size={14} color="#111" />
            <Text style={styles.todayBtnText}>Bugün</Text>
          </Pressable>
        </View>

        <View style={styles.cardBody}>
          <DateTimePicker
            display="inline"
            mode="date"
            value={selectedDate}
            themeVariant={applicationTheme.theme}
            locale={dateLocale}
            minimumDate={new Date(1900, 0, 1)}
            accentColor={currentTheme.primary}
            onChange={(event, picked) => {
              const next = picked ?? selectedDate;
              const y = next.getFullYear();
              const m = next.getMonth() + 1;
              const d = next.getDate();
              const monthChanged = y !== year || m !== month;

              setYear(y);
              setMonth(m);
              setSelectedDay(d);

              if (!monthChanged && monthTimings) {
                // aynı ay içinde sadece günü güncelledik → yeterli
              }
            }}
          />

          {/* 🔹 EKLENDİ: Ay verisi yüklenirken takvim üzerinde overlay spinner */}
          {isMonthLoading && (
            <View style={styles.pickerOverlay}>
              <ActivityIndicator />
              <Text style={styles.overlayText}>Veriler yükleniyor…</Text>
            </View>
          )}
        </View>
      </View>

      {/* Günün Vakitleri – 2 sütun kart */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <Text style={[styles.sectionTitle, { color: '#000' }]}>
          Günün Vakitleri
        </Text>
      </View>

      {!selectedTimings ? (
        <View style={[styles.center, { paddingVertical: 12 }]}>
          <ActivityIndicator />
          <Text style={{ marginTop: 6, opacity: 0.8 }}>
            Vakitler yükleniyor…
          </Text>
        </View>
      ) : (
        <FlatList
          data={['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as Key[]}
          keyExtractor={k => k}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const label = LABELS_TR[item];
            const time = selectedTimings[item];
            return (
              <View
                style={[
                  styles.vakitCard,
                  { borderColor: '#E6E6EA', backgroundColor: '#FFFFFF' },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View
                    style={[
                      styles.vakitIconWrap,
                      { backgroundColor: '#F2F2F7' },
                    ]}
                  >
                    <Ionicons
                      name={ICONS[item] as any}
                      size={18}
                      color={'#111'}
                    />
                  </View>
                  <Text style={[styles.vakitLabel, { color: '#111' }]}>
                    {label}
                  </Text>
                </View>
                <Text style={styles.vakitTime}>{time}</Text>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 6, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenViewContainer>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },

  headerTop: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cityText: { fontSize: 15, fontWeight: '600' },
  roundIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* --- Beyaz Card Takvim --- */
  cardWrap: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E6EA',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    textTransform: 'capitalize',
  },
  cardBody: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bugün butonu
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

  // 🔹 Overlay spinner
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

  vakitCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  vakitIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vakitLabel: { fontSize: 15, fontWeight: '700' },
  vakitTime: { fontSize: 20, fontWeight: '900' },
});
