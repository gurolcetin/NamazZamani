import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useTheme } from '../../../../libs/core/providers';
import { Icon, Icons, ScreenViewContainer } from '../../../../libs/components';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { SearchBarCommands } from 'react-native-screens';
import { useNavigationSearch } from '../../../../libs/core/hooks';
import {
  upsertSavedPlace,
  removeSavedPlace as removeSavedRedux,
  setActiveById,
  setActiveDevice,
  selectSavedPlaces,
  selectActivePlace,
  SavedPlace,
} from '../../../../libs/redux/reducers/location';

type LocationIQItem = {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
  type?: string;
  class?: string;
};

/** ---------- Mapping & Search ---------- */
function mapLocationIQToPlace(n: LocationIQItem): SavedPlace {
  return {
    id: `nom:${n.place_id}`,
    label: n.display_name,
    latitude: parseFloat(n.lat),
    longitude: parseFloat(n.lon),
  };
}

const LOCATIONIQ_API_KEY = 'pk.b319608e31f0680f9a8c4ed7fef57626';

async function searchPlaces(q: string): Promise<SavedPlace[]> {
  if (!q.trim()) return [];

  const url =
    `https://us1.locationiq.com/v1/search?` +
    `key=${LOCATIONIQ_API_KEY}&` +
    `q=${encodeURIComponent(q)}&` +
    `format=json&normalizeaddress=1&limit=12&addressdetails=1&accept-language=tr,en`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as LocationIQItem[];

    return data.map(mapLocationIQToPlace);
  } catch {
    return [];
  }
}

/** =======================================================================
 *                          COMPONENT
 * ======================================================================= */
export default function LocationSelector() {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
  const headerOffset = Platform.OS === 'ios' ? headerHeight : 0;
  const searchRef = useRef<SearchBarCommands>(null!);
  const search = useNavigationSearch({
    searchBarOptions: {
      placeholder: t('General.SearchNewLocation'),
      cancelButtonText: t('General.SearchCancelText'),
      ref: searchRef,
    },
  });

  // UI State

  const saved = useSelector(selectSavedPlaces);
  const active = useSelector(selectActivePlace);

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SavedPlace[]>([]);
  const query = search.trim();
  const hasQuery = query.length > 0;

  /** Debounced Search */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
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
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasQuery, query]);

  /** Navigation Actions */
  const clearSearch = () => {
    searchRef.current?.clearText();
    searchRef.current?.cancelSearch();
  };

  const goDevice = () => {
    dispatch(setActiveDevice());
    clearSearch();
    navigation.goBack(); // <- navigate yerine
  };

  const goWith = (p: SavedPlace) => {
    dispatch(upsertSavedPlace(p));
    dispatch(setActiveById(p.id));
    clearSearch();
    navigation.goBack(); // <- navigate yerine
  };

  /** Active Checks */
  const isActiveDevice = 'type' in active && active.type === 'device';
  const isActiveId = (id: string) => 'id' in active && active.id === id;

  /** Small UI Bits */
  const SelectedBadge = () => (
    <View style={[styles.badge, { backgroundColor: currentTheme.primary }]}>
      <Icon
        type={Icons.MaterialDesignIcons}
        name="check"
        size={12}
        color={currentTheme.white}
      />
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
            <Icon
              type={Icons.FontAwesome6}
              name="location-dot"
              size={18}
              color={currentTheme.white}
              solid
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
              <Icon
                type={Icons.MaterialDesignIcons}
                name="trash-can-outline"
                size={20}
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
            <Icon
              type={Icons.FontAwesome6}
              name="magnifying-glass"
              size={18}
              color={currentTheme.white}
              solid
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
          <Icon
            type={Icons.FontAwesome6}
            name="chevron-right"
            size={18}
            color={currentTheme.textColor}
            solid
          />
        )}
      </Pressable>
    );
  };

  /** ---------- Render ---------- */
  return (
    <ScreenViewContainer>
      <View style={[styles.content, { paddingTop: headerOffset + 12 }]}>
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
            <View style={styles.nextCardLeft}>
              <View style={styles.nextIconWrap}>
                <Icon
                  type={Icons.FontAwesome6}
                  name="location-crosshairs"
                  size={22}
                  color={currentTheme.white}
                  solid
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.nextLabel}>
                  {t('locationSelector.deviceTitle')}
                </Text>
                <Text style={styles.nextHint}>
                  {t('locationSelector.deviceSubtitle')}
                </Text>
              </View>
            </View>

            <View style={styles.nextCardRight}>
              {isActiveDevice && <SelectedBadge />}
              <Icon
                type={Icons.FontAwesome6}
                name="arrow-right"
                size={16}
                color={currentTheme.white}
                solid
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
              contentContainerStyle={styles.savedListContent}
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
            {searching && (
              <ActivityIndicator size="small" color={currentTheme.primary} />
            )}
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
              contentContainerStyle={styles.searchListContent}
            />
          )}
        </>
      )}
      </View>
    </ScreenViewContainer>
  );
}

/** ---------- Styles ---------- */
const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
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
  nextCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flex1: { flex: 1 },
  nextCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  savedListContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

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
