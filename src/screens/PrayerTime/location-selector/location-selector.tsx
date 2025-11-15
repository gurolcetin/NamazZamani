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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../libs/core/providers';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ScreenViewContainer } from '../../../../libs/components';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
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
      'User-Agent': 'NamazZamani/1.0 (gurolmehmetcetin@gmail.com)',
      Accept: 'application/json',
    },
  });
  console.log('res', res);
  const data = (await res.json()) as NominatimItem[];
  console.log('search data', data);
  return data.map(mapNominatimToPlace);
}

/** =======================================================================
 *                          COMPONENT
 * ======================================================================= */
export default function LocationSelector() {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  //   useModalOptions(navigation, currentTheme);

  const dispatch = useDispatch();
  const { t } = useTranslation();

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
    <View style={[styles.badge, { backgroundColor: currentTheme.primary }]}>
      <Ionicons name="checkmark" size={12} color={currentTheme.white} />
      <Text style={styles.badgeText}>{t('locationSelector.selected')}</Text>
    </View>
  );

  /** Renderers */
  const renderSaved = ({ item }: { item: SavedPlace }) => {
    const selected = isActiveId(item.id);
    return (
      <Pressable
        style={[
          styles.rowCard,
          {
            backgroundColor: currentTheme.cardViewBackgroundColor,
          },
        ]}
        onPress={() => goWith(item)}
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.avatarCircle,
              selected && { backgroundColor: currentTheme.primary },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={currentTheme.white}
            />
          </View>
          <Text
            style={[
              styles.rowTitle,
              selected && styles.rowTitleSelected,
              { color: currentTheme.textColor },
            ]}
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
                Alert.alert(
                  t('locationSelector.deleteTitle'),
                  t('locationSelector.deleteMessageWithName', {
                    name: item.label,
                  }),
                  [
                    { text: t('locationSelector.cancel') },
                    {
                      text: t('locationSelector.delete'),
                      style: 'destructive',
                      onPress: () => {
                        dispatch(removeSavedRedux(item.id));
                      },
                    },
                  ],
                )
              }
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={currentTheme.systemRed}
              />
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
        style={[
          styles.rowCard,
          { backgroundColor: currentTheme.cardViewBackgroundColor },
        ]}
        onPress={() => goWith(item)}
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: currentTheme.primary },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={currentTheme.white}
            />
          </View>
          <Text
            style={[styles.rowTitle, { color: currentTheme.textColor }]}
            numberOfLines={2}
          >
            {item.label}
          </Text>
        </View>
        {selected ? (
          <SelectedBadge />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={currentTheme.textColor}
          />
        )}
      </Pressable>
    );
  };

  /** ---------- Render ---------- */
  return (
    <ScreenViewContainer>
      {/* Search Bar */}
      <View style={styles.header}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: currentTheme.cardViewBackgroundColor },
          ]}
        >
          <Ionicons name="search" size={18} color={currentTheme.textColor} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('locationSelector.searchPlaceholder')}
            style={[styles.searchInput, { color: currentTheme.textColor }]}
            placeholderTextColor={currentTheme.placeholderTextColor}
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
          <Pressable
            style={[
              styles.nextCard,
              { backgroundColor: `${currentTheme.primary}CC` },
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
                <Ionicons name="locate" size={22} color={currentTheme.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>
                  {t('locationSelector.deviceTitle')}
                </Text>
                <Text style={styles.nextHint}>
                  {t('locationSelector.deviceSubtitle')}
                </Text>
              </View>
            </View>

            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              {isActiveDevice && <SelectedBadge />}
              <Ionicons
                name="arrow-forward"
                size={16}
                color={currentTheme.white}
              />
            </View>
          </Pressable>

          {/* Kaydedilen Konumlar */}
          {saved.length === 0 ? (
            <Text style={styles.emptyText}>
              {t('locationSelector.emptySaved')}
            </Text>
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
            <Text
              style={[styles.sectionTitle, { color: currentTheme.textColor }]}
            >
              {t('locationSelector.searchResults')}
            </Text>
            {searching && <ActivityIndicator size="small" />}
          </View>
          {results.length === 0 ? (
            <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
              {t('locationSelector.noResults')}
            </Text>
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
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
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
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '400' },
  rowTitleSelected: { fontWeight: '600' },

  emptyText: { paddingHorizontal: 16, paddingVertical: 6, opacity: 0.6 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
