import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Swipeable } from 'react-native-gesture-handler';
import { openSettings } from 'react-native-permissions';
import { useTheme } from '../../../../libs/core/providers';
import { Icon, Icons, ScreenViewContainer } from '../../../../libs/components';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { SearchBarCommands } from 'react-native-screens';
import { useNavigationSearch } from '../../../../libs/core/hooks';
import {
  getCurrentPosition,
  hasLocationPermission,
  requestLocationPermission,
  type LocationPermissionResult,
} from '../permission';
import { reverseGeocode } from '../reverse-geocode';
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
  const [deviceLocationLabel, setDeviceLocationLabel] = useState<string | null>(
    null,
  );
  const [deviceLocationLoading, setDeviceLocationLoading] = useState(true);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<
    boolean | null
  >(null);
  const query = search.trim();
  const hasQuery = query.length > 0;
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const openSwipeIdRef = useRef<string | null>(null);
  const [swipeDemoRequestId, setSwipeDemoRequestId] = useState(0);
  const swipeDemoOpenTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeDemoCloseTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeDemoActiveIdRef = useRef<string | null>(null);
  const swipeDemoHandledRef = useRef(0);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshDeviceLocation = useCallback(
    async (
      requestPermission = false,
    ): Promise<LocationPermissionResult> => {
      setDeviceLocationLoading(true);
      try {
        let permissionResult: LocationPermissionResult;
        if (requestPermission) {
          permissionResult = await requestLocationPermission();
        } else {
          const granted = await hasLocationPermission();
          permissionResult = granted ? 'granted' : 'denied';
        }

        if (!isMountedRef.current) {
          return permissionResult;
        }

        setLocationPermissionGranted(permissionResult === 'granted');

        if (permissionResult !== 'granted') {
          setDeviceLocationLabel(null);
          return permissionResult;
        }

        const pos = await getCurrentPosition();
        const label = await reverseGeocode(pos.latitude, pos.longitude);

        if (isMountedRef.current) {
          setDeviceLocationLabel(label);
        }

        return 'granted';
      } catch {
        if (isMountedRef.current) {
          setDeviceLocationLabel(null);
        }
        return 'denied';
      } finally {
        if (isMountedRef.current) {
          setDeviceLocationLoading(false);
        }
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      refreshDeviceLocation();
    }, [refreshDeviceLocation]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshDeviceLocation();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [refreshDeviceLocation]);

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

  const attachSwipeableRef = (id: string) => (ref: Swipeable | null) => {
    if (ref) {
      swipeableRefs.current[id] = ref;
    } else {
      delete swipeableRefs.current[id];
    }
  };

  const closeSwipeable = (id: string) => {
    swipeableRefs.current[id]?.close();
  };

  const clearSwipeDemoTimers = () => {
    if (swipeDemoOpenTimeoutRef.current) {
      clearTimeout(swipeDemoOpenTimeoutRef.current);
      swipeDemoOpenTimeoutRef.current = null;
    }
    if (swipeDemoCloseTimeoutRef.current) {
      clearTimeout(swipeDemoCloseTimeoutRef.current);
      swipeDemoCloseTimeoutRef.current = null;
    }
  };

  const resetSwipeDemo = () => {
    clearSwipeDemoTimers();
    if (swipeDemoActiveIdRef.current) {
      closeSwipeable(swipeDemoActiveIdRef.current);
      if (openSwipeIdRef.current === swipeDemoActiveIdRef.current) {
        openSwipeIdRef.current = null;
      }
      swipeDemoActiveIdRef.current = null;
    }
  };

  const closeAnyOpenSwipe = () => {
    if (openSwipeIdRef.current) {
      closeSwipeable(openSwipeIdRef.current);
      openSwipeIdRef.current = null;
    }
    resetSwipeDemo();
  };

  useFocusEffect(
    useCallback(() => {
      setSwipeDemoRequestId(id => id + 1);
      return () => {
        resetSwipeDemo();
      };
    }, []),
  );

  const handleContentTouchStart = () => {
    if (openSwipeIdRef.current) {
      closeAnyOpenSwipe();
    }
  };

  useEffect(() => {
    if (swipeDemoRequestId === 0) {
      return;
    }

    if (swipeDemoHandledRef.current === swipeDemoRequestId) {
      return;
    }

    if (hasQuery) {
      return;
    }

    const deletableItem = saved.find(
      item => !('id' in active && active.id === item.id),
    );
    if (!deletableItem) {
      return;
    }

    swipeDemoHandledRef.current = swipeDemoRequestId;
    clearSwipeDemoTimers();

    swipeDemoOpenTimeoutRef.current = setTimeout(() => {
      const swipeable = swipeableRefs.current[deletableItem.id];
      if (!swipeable) {
        return;
      }

      if (typeof swipeable.openRight === 'function') {
        swipeable.openRight();
      }
      swipeDemoActiveIdRef.current = deletableItem.id;
      openSwipeIdRef.current = deletableItem.id;

      swipeDemoCloseTimeoutRef.current = setTimeout(() => {
        swipeable.close();
        swipeDemoActiveIdRef.current = null;
        if (openSwipeIdRef.current === deletableItem.id) {
          openSwipeIdRef.current = null;
        }
      }, 800);
    }, 500);
  }, [active, hasQuery, saved, swipeDemoRequestId]);

  const confirmRemoveSaved = (item: SavedPlace) => {
    Alert.alert(
      t('locationSelector.deleteTitle'),
      t('locationSelector.deleteMessageWithName', {
        name: item.label,
      }),
      [
        {
          text: t('locationSelector.cancel'),
          onPress: () => closeSwipeable(item.id),
        },
        {
          text: t('locationSelector.delete'),
          style: 'destructive',
          onPress: () => {
            dispatch(removeSavedRedux(item.id));
            closeSwipeable(item.id);
          },
        },
      ],
    );
  };

  const renderDeleteAction = (item: SavedPlace) => (
    <View style={styles.deleteActionWrapper}>
      <Pressable
        style={[
          styles.deleteAction,
          {
            backgroundColor: currentTheme.systemRed,
          },
        ]}
        onPress={() => confirmRemoveSaved(item)}
        onTouchStart={(event: GestureResponderEvent) => event.stopPropagation()}
      >
        <Icon
          type={Icons.MaterialDesignIcons}
          name="trash-can-outline"
          size={20}
          color={currentTheme.white}
        />
        <Text style={styles.deleteActionText}>
          {t('locationSelector.delete')}
        </Text>
      </Pressable>
    </View>
  );

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
      <View style={styles.rowWrapper}>
        <Swipeable
          ref={attachSwipeableRef(item.id)}
          enabled={!selected}
          friction={2}
          overshootRight={false}
          onSwipeableWillOpen={() => {
            if (
              openSwipeIdRef.current &&
              openSwipeIdRef.current !== item.id
            ) {
              const prevId = openSwipeIdRef.current;
              closeSwipeable(prevId);
              openSwipeIdRef.current = null;
              if (swipeDemoActiveIdRef.current === prevId) {
                clearSwipeDemoTimers();
                swipeDemoActiveIdRef.current = null;
              }
            }
          }}
          onSwipeableOpen={() => {
            openSwipeIdRef.current = item.id;
          }}
          onSwipeableClose={() => {
            if (openSwipeIdRef.current === item.id) {
              openSwipeIdRef.current = null;
            }
          }}
          renderRightActions={() =>
            selected ? null : renderDeleteAction(item)
          }
        >
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
                <Icon
                  type={Icons.MaterialDesignIcons}
                  name="chevron-left"
                  size={16}
                  color={currentTheme.textColor}
                />
              )}
            </View>
          </Pressable>
        </Swipeable>
      </View>
    );
  };

  const renderResult = ({ item }: { item: SavedPlace }) => {
    const selected = isActiveId(item.id);
    return (
      <View style={styles.rowWrapper}>
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
      </View>
    );
  };

  const deviceLocationSubtitle = deviceLocationLoading
    ? t('locationChip.loading')
    : deviceLocationLabel ?? t('prayerTime.locationNotFound');
  const showPermissionWarning = locationPermissionGranted === false;
  const handlePermissionNoticePress = useCallback(() => {
    openSettings().catch(() => undefined);
  }, []);

  /** ---------- Render ---------- */
  return (
    <ScreenViewContainer disableBottomPadding>
      <View
        style={[styles.content, { paddingTop: headerOffset + 12 }]}
        onTouchStart={handleContentTouchStart}
      >
        {/* ---- hasQuery: false → Mevcut + Kaydedilenler ---- */}
        {!hasQuery && (
          <>
            {/* Mevcut Konum */}
            {showPermissionWarning ? (
              <View
                style={[
                  styles.permissionNotice,
                  {
                    borderColor: `${currentTheme.systemRed}33`,
                    backgroundColor: `${currentTheme.systemRed}0F`,
                  },
                ]}
              >
                <View style={styles.permissionNoticeHeader}>
                  <View
                    style={[
                      styles.permissionNoticeIcon,
                      { backgroundColor: `${currentTheme.systemRed}1F` },
                    ]}
                  >
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="map-marker-off"
                      size={24}
                      color={currentTheme.systemRed}
                    />
                  </View>
                  <View style={styles.permissionNoticeTextBlock}>
                    <Text
                      style={[
                        styles.permissionNoticeTitle,
                        { color: currentTheme.textColor },
                      ]}
                    >
                      {t('locationSelector.permissionWarningTitle')}
                    </Text>
                    <Text
                      style={[
                        styles.permissionNoticeDescription,
                        { color: currentTheme.textColor },
                      ]}
                    >
                      {t('locationSelector.permissionWarningMessage')}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={[
                    styles.permissionNoticeButton,
                    {
                      borderColor: currentTheme.systemRed,
                      backgroundColor: 'transparent',
                    },
                  ]}
                  onPress={handlePermissionNoticePress}
                >
                  <Text
                    style={[
                      styles.permissionNoticeButtonText,
                      { color: currentTheme.systemRed },
                    ]}
                  >
                    {t('locationSelector.openSettings')}
                  </Text>
                </Pressable>
              </View>
            ) : (
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
                      {deviceLocationSubtitle}
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
            )}

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
              <Text
                style={[styles.emptyText, { color: currentTheme.textColor }]}
              >
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
  permissionNotice: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  permissionNoticeHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  permissionNoticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionNoticeTextBlock: {
    flex: 1,
  },
  permissionNoticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  permissionNoticeDescription: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  permissionNoticeButton: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  permissionNoticeButtonText: {
    color: '#D92F2F',
    fontSize: 14,
    fontWeight: '700',
  },

  rowWrapper: {
    marginTop: 10,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 16,
    padding: 14,
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
  deleteActionWrapper: {
    marginLeft: 6,
    borderRadius: 16,
    height: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  deleteAction: {
    borderRadius: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    height: '100%',
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
