// screens/ImsakiyeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

const LABELS_ROW = [
  'İmsak',
  'Güneş',
  'Öğle',
  'İkindi',
  'Akşam',
  'Yatsı',
] as const;
type LabelKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
const ORDER: LabelKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return { y, m, day };
}

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

// ---------- küçük parça: 6 sütunlu grid ----------
function SixColGrid({
  labels,
  values,
  textColor,
}: {
  labels: readonly string[];
  values: string[];
  textColor: string;
}) {
  return (
    <View style={styles.gridWrap}>
      {/* Üst satır: etiketler */}
      <View style={styles.gridRow}>
        {labels.map((lbl, i) => (
          <View key={`lbl-${i}`} style={styles.gridCell}>
            <Text
              style={[styles.gridLabel, { color: textColor }]}
              numberOfLines={1}
            >
              {lbl}
            </Text>
          </View>
        ))}
      </View>
      {/* Alt satır: saatler */}
      <View style={styles.gridRow}>
        {values.map((val, i) => (
          <View key={`val-${i}`} style={styles.gridCell}>
            <Text
              style={[styles.gridValue, { color: textColor }]}
              numberOfLines={1}
            >
              {val}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------- screen ----------
export default function TimeTable() {
  const activeResolved = useSelector(selectActiveResolved);
  const navigation = useNavigation();
  const { currentTheme } = useTheme();

  const [sections, setSections] = useState<Section[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: currentTheme.primary }]}
            >
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isToday = item.isToday;
          const dateText = `${item.weekday}, ${item.dayNum} ${
            TR_MONTHS[item.date.getMonth()]
          }`;

          const valuesRow = ORDER.map(k => item.times[k]);

          const cardStyle = isToday
            ? [styles.rowCard, { backgroundColor: currentTheme.primary }]
            : [
                styles.rowCard,
                { backgroundColor: currentTheme.cardViewBackgroundColor },
              ];

          const titleColor = isToday
            ? currentTheme.white
            : currentTheme.textColor;
          const dividerColor = isToday
            ? currentTheme.white
            : currentTheme.textColor;
          const gridTextColor = isToday
            ? currentTheme.white
            : currentTheme.textColor;

          return (
            <View style={cardStyle}>
              {/* Sol üst: günün tarihi */}
              <Text
                style={[styles.rowDateText, { color: titleColor }]}
                numberOfLines={1}
              >
                {dateText}
              </Text>

              {/* Divider */}
              <View
                style={[styles.divider, { backgroundColor: dividerColor }]}
              />

              {/* 6 sütunlu kompakt grid: üstte etiketler, altta saatler */}
              <SixColGrid
                labels={LABELS_ROW}
                values={valuesRow}
                textColor={gridTextColor}
              />
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

// ---------- styles ----------
const CELL_GAP = 8;

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 24 },

  sectionHeader: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800' },

  rowCard: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    // Android gölge
    elevation: 2,
  },

  rowDateText: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 8,
    marginBottom: 10,
    marginRight: -12, // rowCard'daki paddingHorizontal kadar eksi veriyoruz
  },

  // grid
  gridWrap: {
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: CELL_GAP,
  },
  gridCell: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.95,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '900',
  },
});
