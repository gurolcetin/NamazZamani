import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSelector } from 'react-redux';

import { PrayerTimings, fetchPrayerTimesByCoords } from './api';
import { requestLocationPermission, getCurrentPosition } from './permission';
import {
  Icon,
  Icons,
  PrayerTimeSmallCard,
  ScreenViewContainer,
} from '../../../libs/components';
import { useTheme } from '../../../libs/core/providers';
import { reverseGeocode, getUTCLabel } from './reverse-geocode';
import { useNavigation } from '@react-navigation/native';
import { PrayerTimeScreens } from '../../navigation/Routes';
import { selectActiveResolved } from '../../../libs/redux/reducers/location';
import {
  getTimeZoneByCoords,
  getUtcLabelFromTimeZone,
} from '../../../libs/core/helpers';
import { ActionCardGroup } from './action-cards/action-card-group';
import { PrayerTimeKey, SmallCard } from '../../../libs/common/types';

// ----- Types & Maps ---------------------------------------------------------

const LABELS_TR: Record<PrayerTimeKey, string> = {
  Fajr: 'İmsak',
  Sunrise: 'Güneş',
  Dhuhr: 'Öğle',
  Asr: 'İkindi',
  Maghrib: 'Akşam',
  Isha: 'Yatsı',
};

export const ICONS: Record<
  PrayerTimeKey,
  {
    type: any;
    name: string;
  }
> = {
  Fajr: {
    type: Icons.Ionicons,
    name: 'moon-outline', // 🌙
  },
  Sunrise: {
    type: Icons.MaterialDesignIcons,
    name: 'weather-sunset-up', // 🌅
  },
  Dhuhr: {
    type: Icons.MaterialDesignIcons,
    name: 'weather-sunny', // ☀️
  },
  Asr: {
    type: Icons.MaterialDesignIcons,
    name: 'weather-sunset', // ⛅
  },
  Maghrib: {
    type: Icons.MaterialDesignIcons,
    name: 'weather-sunset-down', // 🌇
  },
  Isha: {
    type: Icons.Ionicons,
    name: 'moon', // 🌙
  },
};
// ----- Time helpers ---------------------------------------------------------
function toTodayDate(hhmm: string, base = new Date()): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}
function fmtClock(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    sec,
  ).padStart(2, '0')}`;
}
function progressBetween(start: Date, end: Date, now = new Date()) {
  const span = end.getTime() - start.getTime();
  if (span <= 0) return 0;
  const passed = now.getTime() - start.getTime();
  return Math.min(1, Math.max(0, passed / span));
}
function buildSequence(t: PrayerTimings) {
  const order: PrayerTimeKey[] = [
    'Fajr',
    'Sunrise',
    'Dhuhr',
    'Asr',
    'Maghrib',
    'Isha',
  ];
  const today = new Date();
  return order.map(k => ({
    key: k,
    label: LABELS_TR[k],
    time: t[k],
    date: toTodayDate(t[k], today),
  }));
}
function computeNext(seq: ReturnType<typeof buildSequence>, now = new Date()) {
  for (let i = 0; i < seq.length; i++) {
    if (now < seq[i].date) {
      const next = seq[i];
      const prev = i === 0 ? seq[seq.length - 1] : seq[i - 1];
      const start = prev.date;
      const end = next.date;
      return {
        prev,
        next,
        leftSec: (end.getTime() - now.getTime()) / 1000,
        progress: progressBetween(start, end, now),
      };
    }
  }
  const last = seq[seq.length - 1];
  const fajr = seq[0];
  const fajrTomorrow = new Date(fajr.date);
  fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
  return {
    prev: last,
    next: { ...fajr, date: fajrTomorrow },
    leftSec: (fajrTomorrow.getTime() - now.getTime()) / 1000,
    progress: progressBetween(last.date, fajrTomorrow, now),
  };
}

// ----- UI -------------------------------------------------------------------

export default function PrayerTime() {
  const { currentTheme } = useTheme();
  const activeResolved = useSelector(selectActiveResolved);

  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [loading, setLoading] = useState(false);

  const [leftClock, setLeftClock] = useState('00:00:00');
  const [leftSec, setLeftSec] = useState(0);
  const nextKeyRef = useRef<PrayerTimeKey>('Fajr');
  const currentKeyRef = useRef<PrayerTimeKey>('Fajr');

  const [locationLabel, setLocationLabel] = useState<string>('Konum alınıyor…');
  const [utcLabel, setUtcLabel] = useState<string>(getUTCLabel());

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  ); // NEW

  const systemDark = useColorScheme() === 'dark';
  const navigation = useNavigation();

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
        setCoords({ lat: latitude, lon: longitude }); // NEW
        const data = await fetchPrayerTimesByCoords(latitude, longitude);
        setTimings(data);

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

  useEffect(() => {
    if (!timings) return;
    const seq = buildSequence(timings);
    const tick = () => {
      const info = computeNext(seq, new Date());
      nextKeyRef.current = info.next.key;
      currentKeyRef.current = info.prev.key;
      setLeftClock(fmtClock(info.leftSec));
      setLeftSec(info.leftSec);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timings]);
  const renderSmallCard = useCallback(
    ({ item, index }: ListRenderItemInfo<SmallCard>) => (
      <PrayerTimeSmallCard item={item} index={index} />
    ),
    []
  );
  const smallCards: SmallCard[] = useMemo(() => {
    if (!timings) return [];
    const seq = buildSequence(timings);
    const cur = currentKeyRef.current;
    return seq.map(x => ({
      key: x.key,
      label: x.label,
      time: x.time,
      isCurrent: x.key === cur,
      miniLeft: x.key === cur ? leftClock : undefined,
      notif: x.key === 'Fajr' || x.key === 'Maghrib',
    }));
  }, [timings, leftClock]);

  // ------- render -----------------------------------------------------------
  if (loading && !timings) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Vakitler yükleniyor…</Text>
      </View>
    );
  }

  // Büyük kart: SIRADAKİ vakit bilgisi + kalan dijital
  const currentLabel = LABELS_TR[currentKeyRef.current];
  const currentIcon = ICONS[currentKeyRef.current] as any;
  const isCritical = leftSec <= 45 * 60;
  const criticalRed = `${currentTheme.systemRed || '#FF3B30'}E6`;
  const cardBg = isCritical ? criticalRed : `${currentTheme.primary}CC`;

  const ListHeader = () => (
    <View>
      {/* Big next card (SIRADAKİ) */}
      <View style={[styles.nextCard, { backgroundColor: cardBg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.nextIconWrap}>
            <Icon
              type={currentIcon.type}
              name={currentIcon.name as any}
              color={'#fff'}
              size={22}
            />
          </View>

          <View>
            <Text style={styles.nextLabel}>
              {currentLabel} vaktinin çıkmasına
            </Text>
            <Text style={styles.nextHint}>{leftClock} kaldı</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // ------- render -----------------------------------------------------------
  if (loading && !timings) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Vakitler yükleniyor…</Text>
      </View>
    );
  }

  return (
    <ScreenViewContainer>
      <View style={{ marginTop: 4 }}>
        <ActionCardGroup
          label={locationLabel}
          utc={utcLabel}
          loading={loading && !timings}
          isDark={systemDark}
          theme={{
            primary: currentTheme.primary,
            textColor: currentTheme.textColor,
          }}
          onOpenLocationSelector={() =>
            navigation.navigate(PrayerTimeScreens.LocationSelector as never)
          }
          onPickDate={() => {
            if (!coords) return;
            navigation.navigate(PrayerTimeScreens.MontlyCalendar as never);
          }}
          onOpenImsakiye={() => {
            if (!coords) return;
            navigation.navigate(PrayerTimeScreens.Imsakiye as never);
          }}
        />
      </View>
      <FlatList
        data={smallCards}
        numColumns={2}
        keyExtractor={i => i.key}
        renderItem={renderSmallCard}
        ListHeaderComponent={ListHeader} // ⬅️ Üst içerikler burada
        contentContainerStyle={{
          paddingBottom: 24,
          paddingHorizontal: 16,
        }}
        columnWrapperStyle={{ justifyContent: 'space-between' }} // 2 kolon aralığı
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={6}
        windowSize={7}
      />
    </ScreenViewContainer>
  );
}

// ----- styles ---------------------------------------------------------------
const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  headerTop: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 10,
  },
  nextCard: {
    marginTop: 14,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  nextHint: { color: 'rgba(255,255,255,0.95)', fontSize: 16, marginTop: 2 },
  nextBigTime: { color: '#fff', fontSize: 32, fontWeight: '800' },
});
