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
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ListRenderItemInfo,
} from 'react-native';

import { Ionicons } from '@react-native-vector-icons/ionicons';
import { PrayerTimings, fetchPrayerTimesByCoords } from './api';
import { requestLocationPermission, getCurrentPosition } from './permission';

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
function fmtHuman(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} saat ${m} dk`;
  return `${m} dk`;
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
  // sıradaki (now, ilk future'a kadar)
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
  // gün bitti → yarın Fajr
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
  isNext?: boolean;
  miniLeft?: string;
  notif?: boolean;
};

export default function VakitlerScreen() {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [loading, setLoading] = useState(false);

  const [leftClock, setLeftClock] = useState('00:00:00');
  const [leftHuman, setLeftHuman] = useState<string>('');
  const [barPct, setBarPct] = useState(0);
  const nextKeyRef = useRef<Key>('Fajr');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const ok = await requestLocationPermission();
      if (!ok) return;
      const { latitude, longitude } = await getCurrentPosition();
      const data = await fetchPrayerTimesByCoords(latitude, longitude);
      setTimings(data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // ticker
  useEffect(() => {
    if (!timings) return;
    const seq = buildSequence(timings);
    const tick = () => {
      const info = computeNext(seq, new Date());
      nextKeyRef.current = info.next.key;
      setLeftClock(fmtClock(info.leftSec));
      setLeftHuman(fmtHuman(info.leftSec));
      setBarPct(info.progress);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timings]);

  const headerTitle = useMemo(() => {
    const n = nextKeyRef.current; // ex. Fajr
    return `${LABELS_TR[n]}’a Kalan`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timings, leftClock]);

  const nextTime = useMemo(() => {
    if (!timings) return '';
    return timings[nextKeyRef.current];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timings, leftClock]);

  // 2 sütun küçük kart verisi
  const smallCards: SmallCard[] = useMemo(() => {
    if (!timings) return [];
    const seq = buildSequence(timings);
    const n = nextKeyRef.current;
    return seq.map(x => ({
      key: x.key,
      label: x.label,
      time: x.time,
      isNext: x.key === n,
      miniLeft: x.key === n ? leftClock.slice(3) : undefined, // mm:ss göster
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
    return (
      <View
        style={[
          styles.smallCard,
          index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 },
          item.isNext && styles.smallCardActive,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons
            name={item.isNext ? 'checkmark-circle' : ICONS[item.key]}
            size={18}
          />
          <Text
            style={[styles.smallTitle, item.isNext && styles.smallTitleActive]}
          >
            {item.label}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          {item.isNext && (
            <Text style={styles.smallMiniLeft}>{item.miniLeft}</Text>
          )}
          <Text
            style={[styles.smallTime, item.isNext && styles.smallTimeActive]}
          >
            {item.time}
          </Text>
          <Ionicons
            name={item.notif ? 'notifications' : 'notifications-outline'}
            size={16}
            style={{ opacity: 0.8 }}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* top-right bell in subtle circle */}
        <View style={styles.headerTop}>
          <Pressable style={styles.cityBtn}>
            <Ionicons name="location" size={16} />
            <Text style={styles.cityText}>İstanbul • UTC+3</Text>
            <Ionicons name="chevron-down" size={16} />
          </Pressable>
          <View style={styles.roundIcon}>
            <Ionicons name="notifications-outline" size={18} />
          </View>
        </View>

        {/* Big title + countdown */}
        <View style={styles.headerBlock}>
          <Text style={styles.bigTitle}>{headerTitle}</Text>
          <Text style={styles.countdown}>{leftClock}</Text>
        </View>

        {/* chip with mini progress */}
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            ~ {headerTitle.replace('’a Kalan', '')} {leftHuman}
          </Text>
          <View style={styles.chipTrack}>
            <View
              style={[
                styles.chipFill,
                { width: `${Math.round(barPct * 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Big next card */}
        <View style={styles.nextCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.nextIconWrap}>
              <Ionicons
                name={ICONS[nextKeyRef.current]}
                size={22}
                color="#fff"
              />
            </View>
            <View>
              <Text style={styles.nextLabel}>
                {LABELS_TR[nextKeyRef.current]}
              </Text>
              <Text style={styles.nextHint}>~ {leftHuman}</Text>
            </View>
          </View>
          <Text style={styles.nextBigTime}>{nextTime}</Text>
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
      </SafeAreaView>
    </View>
  );
}

// ----- styles ---------------------------------------------------------------
const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  headerTop: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
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
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
  },
  cityText: { fontSize: 15, fontWeight: '600' },
  roundIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  headerBlock: { paddingHorizontal: 16, paddingTop: 6 },
  bigTitle: { fontSize: 28, fontWeight: '700', letterSpacing: 0.2 },
  countdown: {
    fontSize: 48,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 1,
  },

  chip: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: { fontSize: 14, fontWeight: '600', opacity: 0.85 },
  chipTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  chipFill: { height: 6, borderRadius: 6, backgroundColor: '#2AC3A2' },

  nextCard: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: '#16b397',
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
  nextHint: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
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
  smallCardActive: {
    backgroundColor: '#1bb89d',
  },
  smallTitle: { fontSize: 16, fontWeight: '700' },
  smallTitleActive: { color: '#fff' },
  smallTime: { fontSize: 18, fontWeight: '800' },
  smallTimeActive: { color: '#fff' },
  smallMiniLeft: {
    fontSize: 12,
    opacity: 0.8,
    color: '#fff',
    alignSelf: 'flex-end',
  },
});
