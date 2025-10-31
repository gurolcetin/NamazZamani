// screens/ImsakiyeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ScreenViewContainer } from '../../../../libs/components';
import { PrayerTimings } from '../api';
import { fetchMonthlyPrayerTimesByCoords } from '../MontlyCalendar/api';
import { useTheme } from '../../../../libs/core/providers';
import { useSelector } from 'react-redux';
import { selectActiveResolved } from '../../../../libs/redux/reducers/location';
import { getCurrentPosition, requestLocationPermission } from '../permission';

// ---------- types ----------
type RowItem = {
  date: Date; // gerçek tarih
  weekday: string; // "Pazartesi"
  dayNum: string; // "31"
  times: PrayerTimings; // {Fajr,Sunrise,...}
  isToday: boolean;
};

type Section = {
  title: string; // "Ekim 2025"
  data: RowItem[];
};

// ---------- helpers ----------
const TR_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
const TR_WEEKDAYS = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
];

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return { y, m, day };
}

// API’mizin yalnızca saatleri döndürmesi nedeniyle,
// Listedeki her gün için ilgili ayın dizininden doğru güne ulaşıyoruz.
async function buildRange(
  start: Date,
  totalDays: number,
  lat: number,
  lon: number,
): Promise<Section[]> {
  const { y: y1, m: m1 } = ymd(start);
  const end = new Date(start);
  end.setDate(start.getDate() + totalDays - 1);
  const { y: y2, m: m2 } = ymd(end);

  // aynı ay mı? değilse iki ay çek
  const month1 = await fetchMonthlyPrayerTimesByCoords(y1, m1, lat, lon);
  const month2 =
    y1 !== y2 || m1 !== m2
      ? await fetchMonthlyPrayerTimesByCoords(y2, m2, lat, lon)
      : null;

  const todayKey = new Date().toDateString();

  const items: RowItem[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const { y, m, day } = ymd(d);
    const arr = y === y1 && m === m1 ? month1 : (month2 as PrayerTimings[]);
    // Aladhan calendar dizisi 1-indexed gün sırası ile döner
    const times = arr[day - 1];

    items.push({
      date: d,
      weekday: TR_WEEKDAYS[d.getDay()],
      dayNum: String(day).padStart(2, '0'),
      times,
      isToday: d.toDateString() === todayKey,
    });
  }

  // Aylara böl, SectionList için hazırla
  const map = new Map<string, RowItem[]>();
  items.forEach(it => {
    const key = `${TR_MONTHS[it.date.getMonth()]} ${it.date.getFullYear()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  });

  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

// ---------- screen ----------
export default function TimeTable() {
  const activeResolved = useSelector(selectActiveResolved);
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const systemDark = useColorScheme() === 'dark';

  const [sections, setSections] = useState<Section[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

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
        const items = await buildRange(startDate, 30, latitude, longitude);
        setSections(items);
      }
    } finally {
      setLoading(false);
    }
  }, [activeResolved, startDate]);
  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    navigation.setOptions?.({ title: 'İmsakiye' });
    load();
  }, [load, navigation]);

  const border = withOpacity(currentTheme.primary, systemDark ? 0.28 : 0.18);
  const pillBg = withOpacity(currentTheme.primary, systemDark ? 0.18 : 0.12);
  const todayBg = `${currentTheme.primary}1F`; // ~12% opaklık
  const todayStroke = withOpacity(currentTheme.primary, 0.35);

  if (loading && !sections) {
    return (
      <ScreenViewContainer>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>İmsakiye yükleniyor…</Text>
        </View>
      </ScreenViewContainer>
    );
  }

  if (error) {
    return (
      <ScreenViewContainer>
        <View style={[styles.center, { padding: 24 }]}>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>Hata</Text>
          <Text style={{ opacity: 0.8, textAlign: 'center' }}>{error}</Text>
        </View>
      </ScreenViewContainer>
    );
  }

  return (
    <ScreenViewContainer>
      <SectionList
        sections={sections || []}
        keyExtractor={item => item.date.toISOString()}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: pillBg, borderColor: border },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: currentTheme.textColor }]}
            >
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isToday = item.isToday;
          return (
            <View
              style={[
                styles.rowCard,
                { borderColor: border },
                isToday && {
                  backgroundColor: todayBg,
                  borderColor: todayStroke,
                },
              ]}
            >
              {/* Sol taraf: tarih */}
              <View style={styles.dateCol}>
                <Text
                  style={[
                    styles.weekday,
                    isToday && { color: currentTheme.primary },
                  ]}
                >
                  {item.weekday}
                </Text>
                <Text style={styles.daynum}>{item.dayNum}</Text>
              </View>

              {/* Sağ taraf: saatler */}
              <View style={styles.timeCol}>
                <TimeCell label="İmsak" value={item.times.Fajr} />
                <TimeCell label="Güneş" value={item.times.Sunrise} />
                <TimeCell label="Öğle" value={item.times.Dhuhr} />
                <TimeCell label="İkindi" value={item.times.Asr} />
                <TimeCell label="Akşam" value={item.times.Maghrib} />
                <TimeCell label="Yatsı" value={item.times.Isha} />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={[styles.center, { padding: 24 }]}>
            <Text>Gösterilecek kayıt yok.</Text>
          </View>
        }
      />
    </ScreenViewContainer>
  );
}

// ---------- small pieces ----------
function TimeCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.timeRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{value}</Text>
    </View>
  );
}

function withOpacity(hex: string, alpha = 0.12) {
  const m = hex?.replace('#', '');
  if (!m || (m.length !== 6 && m.length !== 3)) return `rgba(0,0,0,${alpha})`;
  const norm =
    m.length === 3
      ? m
          .split('')
          .map(c => c + c)
          .join('')
      : m;
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------- styles ----------
const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 24 },

  infoCard: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: { fontWeight: '700' },

  sectionHeader: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800' },

  rowCard: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: { width: 92, alignItems: 'flex-start', justifyContent: 'center' },
  weekday: { fontSize: 14, fontWeight: '800', opacity: 0.9 },
  daynum: { fontSize: 24, fontWeight: '900', marginTop: 2 },

  timeCol: { flex: 1 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  timeLabel: { fontSize: 13, fontWeight: '700', opacity: 0.85 },
  timeValue: { fontSize: 15, fontWeight: '900' },
});
