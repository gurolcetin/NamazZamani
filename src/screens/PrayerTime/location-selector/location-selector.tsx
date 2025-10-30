import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useModalOptions } from '../../../../libs/core/hooks';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../libs/core/providers';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ScreenViewContainer } from '../../../../libs/components';
import { Routes } from '../../../navigation/Routes';

/** ---------- Types ---------- */
type SavedPlace = {
  id: string;            // provider id or composed key (örn: "nom:123")
  label: string;         // örn: "Kadıköy, İstanbul, Türkiye"
  latitude: number;
  longitude: number;
};

type NominatimItem = {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  address?: Record<string, string>;
};

type ActivePlace = { type: 'device' } | { id: string };

/** ---------- Storage Keys ---------- */
const STORAGE_KEY = 'saved_places_v1';
const ACTIVE_KEY = 'active_place_v1';

/** ---------- Storage Helpers ---------- */
async function loadSaved(): Promise<SavedPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPlace[]) : [];
  } catch {
    return [];
  }
}
async function saveAll(items: SavedPlace[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
async function loadActive(): Promise<ActivePlace | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActivePlace) : null;
  } catch {
    return null;
  }
}
async function saveActive(a: ActivePlace) {
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(a));
}

/** ---------- Mapping & Search ---------- */
function mapNominatimToPlace(n: NominatimItem): SavedPlace {
  return {
    id: `nom:${n.place_id}`,
    label: n.display_name,
    latitude: parseFloat(n.lat),
    longitude: parseFloat(n.lon),
  };
}

async function searchPlaces(q: string): Promise<SavedPlace[]> {
  if (!q.trim()) return [];
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    `format=jsonv2&addressdetails=1&limit=12&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'YourAppName/1.0 (contact@example.com)',
      Accept: 'application/json',
    },
  });
  const data = (await res.json()) as NominatimItem[];
  return data.map(mapNominatimToPlace);
}

/** =======================================================================
 *                          COMPONENT
 * ======================================================================= */
export default function LocationSelector() {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  useModalOptions(navigation, currentTheme);

  // UI State
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SavedPlace[]>([]);
  const [saved, setSaved] = useState<SavedPlace[]>([]);
  const [active, setActive] = useState<ActivePlace | null>(null);

  const hasQuery = query.trim().length > 0;

  /** İlk yükleme: Kaydedilenler + Aktif */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, a] = await Promise.all([loadSaved(), loadActive()]);
      if (!mounted) return;
      setSaved(s);
      setActive(a ?? { type: 'device' }); // yoksa cihaz seçili kabul et
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /** Debounced Search */
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!hasQuery) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const list = await searchPlaces(query.trim());
        setResults(list);
      } catch (e) {
        console.warn(e);
      } finally {
        setSearching(false);
      }
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /** CRUD Helpers */
  const addIfNotExists = async (p: SavedPlace) => {
    const exists = saved.some(x => x.id === p.id);
    if (exists) return;
    const next = [p, ...saved];
    setSaved(next);
    await saveAll(next);
  };

  const removeSaved = async (id: string) => {
    const next = saved.filter(x => x.id !== id);
    setSaved(next);
    await saveAll(next);
    // Eğer silinen seçiliyse, aktif cihaz olsun
    if (active && 'id' in active && active.id === id) {
      const a = { type: 'device' } as const;
      setActive(a);
      await saveActive(a);
    }
  };

  /** Navigation Actions */
  const goDevice = async () => {
    const a = { type: 'device' } as const;
    setActive(a);
    await saveActive(a);
    setQuery(''); // aramayı sıfırla → geri gelince listeler görünür
    navigation.navigate(
      Routes.PrayerTime as never,
      { selectedLocation: a, merge: true } as never
    );
  };

  const goWith = async (p: SavedPlace) => {
    await addIfNotExists(p);
    const a = { id: p.id } as const;
    setActive(a);
    await saveActive(a);
    setQuery(''); // aramayı sıfırla → geri gelince listeler görünür
    navigation.navigate(
      Routes.PrayerTime as never,
      {
        selectedLocation: {
          label: p.label,
          latitude: p.latitude,
          longitude: p.longitude,
          id: p.id,
        },
        merge: true,
      } as never
    );
  };

  /** Active Checks */
  const isActiveDevice = active && 'type' in active && active.type === 'device';
  const isActiveId = (id: string) => active && 'id' in active && active.id === id;

  /** Small UI Bits */
  const SelectedBadge = () => (
    <View style={styles.badge}>
      <Ionicons name="checkmark" size={12} color="#fff" />
      <Text style={styles.badgeText}>Seçili</Text>
    </View>
  );

  /** Renderers */
  const renderSaved = ({ item }: { item: SavedPlace }) => {
    const selected = isActiveId(item.id);
    return (
      <Pressable
        style={[styles.rowCard, selected && styles.rowCardSelected]}
        onPress={() => goWith(item)}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.avatarCircle, selected && styles.avatarCircleSelected]}>
            <Ionicons name="location-outline" size={18} color="#fff" />
          </View>
          <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
        <View style={styles.rowRight}>
          {selected ? (
            <SelectedBadge />
          ) : (
            <Pressable
              hitSlop={10}
              onPress={() =>
                Alert.alert('Konumu Sil', `"${item.label}" silinsin mi?`, [
                  { text: 'Vazgeç' },
                  { text: 'Sil', style: 'destructive', onPress: () => removeSaved(item.id) },
                ])
              }
            >
              <Ionicons name="trash-outline" size={18} />
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  const renderResult = ({ item }: { item: SavedPlace }) => {
    const selected = isActiveId(item.id);
    return (
      <Pressable
        style={[styles.rowCard, selected && styles.rowCardSelected]}
        onPress={() => goWith(item)}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: '#6C8CF5' }]}>
            <Ionicons name="search-outline" size={18} color="#fff" />
          </View>
          <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
        {selected ? <SelectedBadge /> : <Ionicons name="chevron-forward" size={18} />}
      </Pressable>
    );
  };

  /** ---------- Render ---------- */
  return (
    <ScreenViewContainer>
      {/* Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Şehir / ilçe / mahalle ara"
            style={styles.searchInput}
            placeholderTextColor="rgba(0,0,0,0.45)"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ---- hasQuery: false → Mevcut + Kaydedilenler ---- */}
      {!hasQuery && (
        <>
          {/* Mevcut Konum */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mevcut Konum</Text>
          </View>
          <Pressable
            style={[
              styles.nextCard,
              { backgroundColor: `${currentTheme.primary}CC` },
              isActiveDevice && styles.nextCardSelected,
            ]}
            onPress={goDevice}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={styles.nextIconWrap}>
                <Ionicons name="locate" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>Bulunduğun Yer</Text>
                <Text style={styles.nextHint}>Cihaz konumu</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isActiveDevice && <SelectedBadge />}
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </Pressable>

          {/* Kaydedilen Konumlar */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kaydedilen Konumlar</Text>
          </View>
          {saved.length === 0 ? (
            <Text style={styles.emptyText}>Henüz kayıtlı konum yok.</Text>
          ) : (
            <FlatList
              data={saved}
              keyExtractor={i => i.id}
              renderItem={renderSaved}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            />
          )}
        </>
      )}

      {/* ---- hasQuery: true → Sadece Arama Sonuçları ---- */}
      {hasQuery && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Arama Sonuçları</Text>
            {searching && <ActivityIndicator size="small" />}
          </View>
          {results.length === 0 ? (
            <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={i => i.id}
              renderItem={renderResult}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            />
          )}
        </>
      )}
    </ScreenViewContainer>
  );
}

/** ---------- Styles ---------- */
const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  searchInput: { flex: 1, fontSize: 15 },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', opacity: 0.7 },

  nextCard: {
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nextCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  nextIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { color: '#fff', fontSize: 16, fontWeight: '800' },
  nextHint: { color: 'rgba(255,255,255,0.95)', fontSize: 13, marginTop: 2 },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
  },
  rowCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7A8C99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleSelected: { backgroundColor: '#3C87F3' },

  rowTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowTitleSelected: { fontWeight: '800' },

  emptyText: { paddingHorizontal: 16, paddingVertical: 6, opacity: 0.6 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3C87F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
