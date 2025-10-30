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
} from 'react-native';

import { Ionicons } from '@react-native-vector-icons/ionicons';
import { PrayerTimings, fetchPrayerTimesByCoords } from './api';
import { requestLocationPermission, getCurrentPosition } from './permission';
import { ScreenViewContainer } from '../../../libs/components';
import { useTheme } from '../../../libs/core/providers';
import { reverseGeocode, getUTCLabel } from './reverse-geocode';
import { LocationChip } from './location';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Routes } from '../../navigation/Routes';

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

type RtParams = {
  params?: {
    selectedLocation?:
      | { type: 'device' }
      | { label: string; latitude: number; longitude: number; id?: string };
    prefetchedTimings?: PrayerTimings;
  };
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
  isCurrent?: boolean; // ŞU ANKİ vakit vurgusu
  miniLeft?: string;
  notif?: boolean;
};

export default function PrayerTime() {
  const { currentTheme } = useTheme();
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [loading, setLoading] = useState(false);

  const [leftClock, setLeftClock] = useState('00:00:00'); // sonraki vakte kalan dijital
  const [leftSec, setLeftSec] = useState(0);
  const nextKeyRef = useRef<Key>('Fajr'); // SIRADAKİ
  const currentKeyRef = useRef<Key>('Fajr'); // ŞU ANKİ (prev)

  const [locationLabel, setLocationLabel] = useState<string>('Konum alınıyor…');
  const [utcLabel, setUtcLabel] = useState<string>(getUTCLabel());

  const systemDark = useColorScheme() === 'dark';
  const navigation = useNavigation();

  const route = useRoute<RouteProp<RtParams>>();
  const picked = route.params?.selectedLocation;

  const load = useCallback(async () => {
    try {
      setLoading(true);

      let latitude: number | null = null;
      let longitude: number | null = null;
      let label: string | null = null;

      if (picked && 'type' in picked && picked.type === 'device') {
        // cihaz konumunu kullan
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
      } else if (picked && 'latitude' in picked) {
        // seçilmiş sabit konum
        latitude = picked.latitude;
        longitude = picked.longitude;
        label = picked.label;
      } else {
        // ilk açılış: cihaz konumu
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
      }

      if (latitude != null && longitude != null) {
        const data = await fetchPrayerTimesByCoords(latitude, longitude);
        setTimings(data);
      }
      if (label) setLocationLabel(label);
      setUtcLabel(getUTCLabel());
    } finally {
      setLoading(false);
    }
  }, [picked]);

  useEffect(() => {
    load();
  }, [load]);

  // ticker: hem SIRADAKİ hem ŞU ANKİ bilgiyi güncelle
  useEffect(() => {
    if (!timings) return;
    const seq = buildSequence(timings);
    const tick = () => {
      const info = computeNext(seq, new Date());
      nextKeyRef.current = info.next.key; // sıradaki
      currentKeyRef.current = info.prev.key; // şu anki
      setLeftClock(fmtClock(info.leftSec)); // sıradakiye kalan
      setLeftSec(info.leftSec); // <-- eklendi
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timings]);

  // 2 sütun küçük kart verisi (VURGULU = ŞU ANKİ)
  const smallCards: SmallCard[] = useMemo(() => {
    if (!timings) return [];
    const seq = buildSequence(timings);
    const cur = currentKeyRef.current;
    return seq.map(x => ({
      key: x.key,
      label: x.label,
      time: x.time,
      isCurrent: x.key === cur,
      // İstersen şu anki kartta mini geri sayımı da göster (sonrakiye kalan):
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

  return (
    <ScreenViewContainer>
      {/* top-right bell in subtle circle */}
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
            navigation.navigate(Routes.LocationSelector as never);
          }}
        />
        <View style={styles.roundIcon}>
          <Ionicons name="notifications-outline" size={18} />
        </View>
      </View>

      {/* Big next card (SIRADAKİ) */}
      <View style={[styles.nextCard, { backgroundColor: cardBg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.nextIconWrap}>
            {/* Soldaki ikon: ŞU ANKİ vakit */}
            <Ionicons name={currentIcon} size={22} color="#fff" />
          </View>

          <View>
            {/* Başlık: ŞU ANKİ vakit label'ı */}
            <Text style={styles.nextLabel}>
              {currentLabel} vaktinin çıkmasına
            </Text>
            {/* Alt metin: vaktinin çıkmasına ... */}

            <Text style={styles.nextHint}>{leftClock} kaldı</Text>
          </View>
          {/* SADECE KRİTİKTE: saati kırmızı mini-card içinde göster */}
        </View>

        {/* Sağdaki saat KALDIRILDI */}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
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
