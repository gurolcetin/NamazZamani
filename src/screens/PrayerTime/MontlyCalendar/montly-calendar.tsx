import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { useTheme } from '../../../../libs/core/providers';
import { ScreenViewContainer } from '../../../../libs/components';
import { fetchMonthlyPrayerTimesByCoords, type PrayerTimings } from './api';
import { getCurrentPosition, requestLocationPermission } from '../permission';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  LanguageLocaleKeys,
  LanguagePrefix,
} from '../../../../libs/common/constants';
import { selectActiveResolved } from '../../../../libs/redux/reducers/location';
import { getUTCLabel, reverseGeocode } from '../reverse-geocode';
import {
  getTimeZoneByCoords,
  getUtcLabelFromTimeZone,
} from '../../../../libs/core/helpers';
import { LocationChip } from '../location';

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
  const activeResolved = useSelector(selectActiveResolved);
  const { i18n } = useTranslation();

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  const [loading, setLoading] = useState(true);

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  const [locationLabel, setLocationLabel] = useState<string>('Konum alınıyor…');
  const [utcLabel, setUtcLabel] = useState<string>(getUTCLabel());

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
          label = 'Konum bulunamadı';
        }
      } else {
        latitude = activeResolved.latitude;
        longitude = activeResolved.longitude;
        label = activeResolved.label;
      }
      if (latitude != null && longitude != null) {
        setCoords({ lat: latitude, lon: longitude });
        const tz = getTimeZoneByCoords(latitude, longitude);
        const label2 = getUtcLabelFromTimeZone(tz, new Date());
        setUtcLabel(label2);
      }
      if (label) setLocationLabel(label);
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
  }, [coords, year, month, selectedDay]); // selectedDay çıkarıldı

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
      <View style={styles.locationRow}>
        <LocationChip
          label={locationLabel}
          utc={utcLabel}
          loading={loading}
          themeColors={{
            primary: currentTheme.primary,
            text: currentTheme.textColor,
            isDark: false,
          }}
          onPress={() => {}}
        />
      </View>

      {/* Beyaz Card içinde Takvim başlık + gövde */}
      <View style={styles.cardWrap}>
        <View style={styles.cardHeader}>
          {/* Orta: seçili gün bilgisi */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.cardTitle}>
              {selectedDate.toLocaleDateString(dateLocale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          {/* Sol: Android'te Tarih Değiştir butonu, iOS'ta boş yer tutucu */}
          {Platform.OS === 'android' ? (
            <Pressable
              onPress={() => setShowPicker(true)}
              style={styles.dateBtn}
              disabled={isMonthLoading}
            >
              <Ionicons name="calendar-outline" size={14} color="#111" />
              <Text style={styles.dateBtnText}>Tarih Değiştir</Text>
            </Pressable>
          ) : (
            <View style={{ width: 1 }} />
          )}
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

        <View style={[styles.cardBody, {paddingHorizontal: Platform.OS === 'android' ? 0 : 6, paddingVertical: Platform.OS === 'android' ? 0 : 6,}]}>
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

      {/* Günün Vakitleri – 2 sütun kart */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <Text style={[styles.sectionTitle, { color: '#000' }]}>Günün Vakitleri</Text>
      </View>

      {!selectedTimings ? (
        <View style={[styles.center, { paddingVertical: 12 }]}>
          <ActivityIndicator />
          <Text style={{ marginTop: 6, opacity: 0.8 }}>Vakitler yükleniyor…</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.vakitIconWrap, { backgroundColor: '#F2F2F7' }]}>
                    <Ionicons name={ICONS[item] as any} size={18} color={'#111'} />
                  </View>
                  <Text style={[styles.vakitLabel, { color: '#111' }]}>{label}</Text>
                </View>
                <Text style={styles.vakitTime}>{time}</Text>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 6, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ANDROID: dialog tipi DatePicker tetikleyici */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          display="default"
          mode="date"
          value={selectedDate}
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
    marginTop: 10,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginHorizontal: 16,
  },
});
