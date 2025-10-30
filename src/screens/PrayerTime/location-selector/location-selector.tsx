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
import { useModalOptions } from '../../../../libs/core/hooks';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../libs/core/providers';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ScreenViewContainer } from '../../../../libs/components';
import { useDispatch, useSelector } from 'react-redux';
import {
  upsertSavedPlace,
  removeSavedPlace as removeSavedRedux,
  setActiveById,
  setActiveDevice,
  selectSavedPlaces,
  selectActivePlace,
  SavedPlace,
} from '../../../../libs/redux/reducers/location';

type NominatimItem = {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  address?: Record<string, string>;
};

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

  const dispatch = useDispatch();

  // UI State

  const saved = useSelector(selectSavedPlaces);
  const active = useSelector(selectActivePlace);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SavedPlace[]>([]);
  const hasQuery = query.trim().length > 0;

  /** Debounced Search */
  const timerRef = useRef<any>(null);
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
  const removeSaved = (id: string) => {
    Alert.alert('Konumu Sil', 'Silinsin mi?', [
      { text: 'Vazgeç' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => dispatch(removeSavedRedux(id)),
      },
    ]);
  };

  /** Navigation Actions */
  const goDevice = () => {
    dispatch(setActiveDevice());
    setQuery('');
    navigation.goBack(); // <- navigate yerine
  };

  const goWith = (p: SavedPlace) => {
    dispatch(upsertSavedPlace(p));
    dispatch(setActiveById(p.id));
    setQuery('');
    navigation.goBack(); // <- navigate yerine
  };

  /** Active Checks */
  const isActiveDevice = 'type' in active && active.type === 'device';
  const isActiveId = (id: string) => 'id' in active && active.id === id;

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
          <View
            style={[
              styles.avatarCircle,
              selected && styles.avatarCircleSelected,
            ]}
          >
            <Ionicons name="location-outline" size={18} color="#fff" />
          </View>
          <Text
            style={[styles.rowTitle, selected && styles.rowTitleSelected]}
            numberOfLines={2}
          >
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
                  {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => removeSaved(item.id),
                  },
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
          <Text
            style={[styles.rowTitle, selected && styles.rowTitleSelected]}
            numberOfLines={2}
          >
            {item.label}
          </Text>
        </View>
        {selected ? (
          <SelectedBadge />
        ) : (
          <Ionicons name="chevron-forward" size={18} />
        )}
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                flex: 1,
              }}
            >
              <View style={styles.nextIconWrap}>
                <Ionicons name="locate" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>Bulunduğun Yer</Text>
                <Text style={styles.nextHint}>Cihaz konumu</Text>
              </View>
            </View>

            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
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
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 8,
              }}
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
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 24,
              }}
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
