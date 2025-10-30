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
  StyleSheet,
  Text,
  View,
  ListRenderItemInfo,
  useColorScheme,
  Pressable, // NEW
} from 'react-native';
import { useSelector } from 'react-redux';

import { Ionicons } from '@react-native-vector-icons/ionicons';
import { PrayerTimings, fetchPrayerTimesByCoords } from './api';
import { requestLocationPermission, getCurrentPosition } from './permission';
import { ScreenViewContainer } from '../../../libs/components';
import { useTheme } from '../../../libs/core/providers';
import { reverseGeocode, getUTCLabel } from './reverse-geocode';
import { LocationChip } from './location';
import { useNavigation } from '@react-navigation/native';
import { PrayerTimeScreens } from '../../navigation/Routes';
import { selectActiveResolved } from '../../../libs/redux/reducers/location';
import {
  getTimeZoneByCoords,
  getUtcLabelFromTimeZone,
} from '../../../libs/core/helpers';

// ----- Types & Maps ---------------------------------------------------------
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
  const order: Key[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
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
type SmallCard = {
  key: Key;
  label: string;
  time: string;
  isCurrent?: boolean;
  miniLeft?: string;
  notif?: boolean;
};

export default function PrayerTime() {
  const { currentTheme } = useTheme();
  const activeResolved = useSelector(selectActiveResolved);

  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [loading, setLoading] = useState(false);

  const [leftClock, setLeftClock] = useState('00:00:00');
  const [leftSec, setLeftSec] = useState(0);
  const nextKeyRef = useRef<Key>('Fajr');
  const currentKeyRef = useRef<Key>('Fajr');

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

  const renderSmall = ({ item, index }: ListRenderItemInfo<SmallCard>) => {
    const active = item.isCurrent;
    return (
      <View
        style={[
          styles.smallCard,
          index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 },
          active && { backgroundColor: currentTheme.primary },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons
            name={ICONS[item.key] as any}
            size={18}
            color={active ? 'white' : 'black'}
          />
          <Text style={[styles.smallTitle, active && styles.smallTitleActive]}>
            {item.label}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          {active && <Text style={styles.smallMiniLeft}>{item.miniLeft}</Text>}
          <Text style={[styles.smallTime, active && styles.smallTimeActive]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  // Büyük kart: SIRADAKİ vakit bilgisi + kalan dijital
  const currentLabel = LABELS_TR[currentKeyRef.current];
  const currentIcon = ICONS[currentKeyRef.current] as any;
  const isCritical = leftSec <= 45 * 60;
  const criticalRed = `${currentTheme.systemRed || '#FF3B30'}E6`;
  const cardBg = isCritical ? criticalRed : `${currentTheme.primary}CC`;

  // Helper: buton rengi ve disabled hali  // NEW
  const pillBg = (alpha: number = 0.12) =>
    `rgba(${parseInt(currentTheme.primary.slice(1, 3), 16)}, ${parseInt(
      currentTheme.primary.slice(3, 5),
      16,
    )}, ${parseInt(currentTheme.primary.slice(5, 7), 16)}, ${alpha})`;
  const isButtonsDisabled = !coords || loading;

  return (
    <ScreenViewContainer>
      {/* top-right area */}
      <View style={styles.headerTop}>
        <LocationChip
          label={locationLabel}
          utc={utcLabel}
          themeColors={{
            primary: currentTheme.primary,
            text: currentTheme.textColor,
            isDark: systemDark,
          }}
          loading={loading && !timings}
          onPress={() => {
            navigation.navigate(PrayerTimeScreens.LocationSelector as never);
          }}
        />
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          disabled={isButtonsDisabled}
          onPress={() => {
            if (!coords) return;
            // navigation.navigate((Routes as any).PrayerCalendar, {
            //   label: locationLabel,
            //   coords,
            // } as never);
          }}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: pillBg(systemDark ? 0.18 : 0.12),
              borderColor: pillBg(systemDark ? 0.35 : 0.22),
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: isButtonsDisabled ? 0.6 : 1,
            },
          ]}
        >
          <View style={styles.actionLeft}>
            <View
              style={[styles.actionIconWrap, { backgroundColor: pillBg(0.25) }]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={currentTheme.primary}
              />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.actionTitle}>Tarih Seç</Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          disabled={isButtonsDisabled}
          onPress={() => {
            if (!coords) return;
            // navigation.navigate((Routes as any).Imsakiye, {
            //   label: locationLabel,
            //   coords,
            //   days: 30,
            //   startFromToday: true,
            // } as never);
          }}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: pillBg(systemDark ? 0.18 : 0.12),
              borderColor: pillBg(systemDark ? 0.35 : 0.22),
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: isButtonsDisabled ? 0.6 : 1,
            },
          ]}
        >
          <View style={styles.actionLeft}>
            <View
              style={[styles.actionIconWrap, { backgroundColor: pillBg(0.25) }]}
            >
              <Ionicons
                name="list-outline"
                size={18}
                color={currentTheme.primary}
              />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.actionTitle}>İmsakiye</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Big next card (SIRADAKİ) */}
      <View style={[styles.nextCard, { backgroundColor: cardBg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.nextIconWrap}>
            <Ionicons name={currentIcon} size={22} color="#fff" />
          </View>

          <View>
            <Text style={styles.nextLabel}>
              {currentLabel} vaktinin çıkmasına
            </Text>
            <Text style={styles.nextHint}>{leftClock} kaldı</Text>
          </View>
        </View>
      </View>

      {/* grid (2 columns) small cards */}
      <FlatList
        data={smallCards}
        numColumns={2}
        keyExtractor={i => i.key}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={renderSmall}
        showsVerticalScrollIndicator={false}
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

  /** NEW: actions row + buttons */
  actionsRow: {
    marginTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row', // 🔹 yan yana diz
    justifyContent: 'space-between',
    gap: 10,
  },
  actionBtn: {
    flex: 1, // 🔹 her biri eşit alan alsın
    maxWidth: '48%', // 🔹 yarı yarıya paylaştırsın
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionSub: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },

  nextCard: {
    marginTop: 14,
    marginHorizontal: 16,
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

  smallCard: {
    flex: 1,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 84,
  },
  smallTitle: { fontSize: 16, fontWeight: '700' },
  smallTitleActive: { color: '#fff' },
  smallTime: { fontSize: 18, fontWeight: '800' },
  smallTimeActive: { color: '#fff' },
  smallMiniLeft: {
    fontSize: 12,
    opacity: 0.9,
    color: '#fff',
    alignSelf: 'flex-end',
  },
});
