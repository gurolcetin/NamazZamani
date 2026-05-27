import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Modal,
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
import {
  Icon,
  Icons,
  ScreenViewContainer,
  BottomBannerAd,
} from '../../../../libs/components';
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
import { FontScaleOption } from '../../../../libs/common/enums';
import { getFontScaleMultiplier } from '../../../../libs/core/helpers';
import {
  OPENWEATHER_API_KEY,
  OPENWEATHER_GEO_BASE_URL,
} from '../../../../libs/common/constants/externalApis';
import {
  updatePrayerTimeMethod,
  DEVICE_METHOD_KEY,
} from '../../../../libs/redux/reducers/ApplicationSettings';
import { PrayerTimeMethodOption } from '../../../../libs/common/types';

type OWMDirectItem = {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

/** ---------- Mapping & Search ---------- */
function mapOWMToPlace(item: OWMDirectItem): SavedPlace {
  const localName =
    item.local_names?.tr || item.local_names?.en || item.name;
  const parts = [localName, item.state, item.country].filter(Boolean);
  return {
    id: `owm:${item.lat.toFixed(4)},${item.lon.toFixed(4)}`,
    label: parts.join(', '),
    latitude: item.lat,
    longitude: item.lon,
  };
}

const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000; // 1 saat
const MAX_SEARCH_CACHE_ENTRIES = 25;

type SearchCacheEntry = {
  expiresAt: number;
  results: SavedPlace[];
};

const searchResultsCache = new Map<string, SearchCacheEntry>();

function getSearchCacheKey(q: string) {
  return q.trim().toLowerCase();
}

function getSearchCache(key: string) {
  const entry = searchResultsCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    searchResultsCache.delete(key);
    return null;
  }
  return entry.results;
}

function setSearchCache(key: string, results: SavedPlace[]) {
  if (searchResultsCache.size >= MAX_SEARCH_CACHE_ENTRIES) {
    const oldestKey = searchResultsCache.keys().next().value;
    if (oldestKey) {
      searchResultsCache.delete(oldestKey);
    }
  }
  searchResultsCache.set(key, {
    results,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
}

const DEFAULT_METHOD_ID = 13;

async function searchPlaces(q: string): Promise<SavedPlace[]> {
  if (!q.trim()) return [];
  if (!OPENWEATHER_API_KEY) return [];

  const cacheKey = getSearchCacheKey(q);
  const cached = getSearchCache(cacheKey);
  if (cached) {
    return cached;
  }

  const url =
    `${OPENWEATHER_GEO_BASE_URL}/direct?` +
    `q=${encodeURIComponent(q)}&` +
    `limit=10&appid=${OPENWEATHER_API_KEY}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as OWMDirectItem[];
    const mapped = data.map(mapOWMToPlace);
    setSearchCache(cacheKey, mapped);
    return mapped;
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
      placement: 'integrated',
      allowToolbarIntegration: false,
    },
  });
  // UI State

  const saved = useSelector(selectSavedPlaces);
  const active = useSelector(selectActivePlace);
  const applicationSettings = useSelector(
    (state: any) => state.applicationSettings,
  );
  const rawMethodOptions = applicationSettings?.prayerTimeMethods;
  const methodOptions: PrayerTimeMethodOption[] = useMemo(
    () => (Array.isArray(rawMethodOptions) ? rawMethodOptions : []),
    [rawMethodOptions],
  );
  const methodOptionsAvailable = methodOptions.length > 0;
  const rawMethodPreferences = applicationSettings?.prayerTimeMethodPreferences;
  const methodPreferences = useMemo(
    () => rawMethodPreferences ?? {},
    [rawMethodPreferences],
  );
  const methodNameLookup = useMemo(() => {
    const map = new Map<number, string>();
    methodOptions.forEach(option => {
      map.set(option.id, option.name);
    });
    return map;
  }, [methodOptions]);
  const getLocationLabelByKey = useCallback(
    (key: string) => {
      if (key === DEVICE_METHOD_KEY) {
        return t('locationSelector.deviceTitle');
      }
      const found = saved.find(x => x.id === key);
      return found?.label ?? t('locationSelector.methodUnknownLocation');
    },
    [saved, t],
  );
  const getMethodPreferenceForKey = useCallback(
    (key: string) => {
      if (methodPreferences[key]) {
        return methodPreferences[key];
      }
      if (key === DEVICE_METHOD_KEY) {
        return {
          methodId: applicationSettings?.prayerTimeMethod ?? DEFAULT_METHOD_ID,
          manuallySet:
            applicationSettings?.prayerTimeMethodManuallySet ?? false,
        };
      }
      return {
        methodId: applicationSettings?.prayerTimeMethod ?? DEFAULT_METHOD_ID,
        manuallySet: false,
      };
    },
    [applicationSettings, methodPreferences],
  );
  const computeMethodInfo = useCallback(
    (pref: { methodId: number; manuallySet: boolean }) => {
      const methodName =
        methodNameLookup.get(pref.methodId) ??
        t('locationSelector.methodUnknown');
      const statusLabel = pref.manuallySet
        ? t('locationSelector.methodManualStatus')
        : t('locationSelector.methodAutoStatus');
      return { methodName, statusLabel, pref };
    },
    [methodNameLookup, t],
  );
  const getMethodInfoForKey = useCallback(
    (key: string) => {
      const pref = getMethodPreferenceForKey(key);
      return computeMethodInfo(pref);
    },
    [computeMethodInfo, getMethodPreferenceForKey],
  );
  const deviceMethodInfo = getMethodInfoForKey(DEVICE_METHOD_KEY);

  const [newLocationMethodPref, setNewLocationMethodPref] = useState(() => ({
    methodId: applicationSettings?.prayerTimeMethod ?? DEFAULT_METHOD_ID,
    manuallySet: false,
  }));
  const newLocationMethodInfo = computeMethodInfo(newLocationMethodPref);
  const newLocationCardLabel = t('locationSelector.methodNewLocationTitle');
  const newMethodValueText = methodOptionsAvailable
    ? newLocationMethodPref.manuallySet
      ? newLocationMethodInfo.methodName
      : t('locationSelector.methodAutoPlaceholder')
    : t('locationSelector.methodLoading');
  const newMethodHintText = methodOptionsAvailable
    ? newLocationMethodPref.manuallySet
      ? t('locationSelector.methodManualHint', {
          location: newLocationCardLabel,
        })
      : t('locationSelector.methodAutoHint', {
          location: newLocationCardLabel,
        })
    : t('locationSelector.methodLoadingHint');
  const newMethodStatusLabel = newLocationMethodPref.manuallySet
    ? t('locationSelector.methodManualStatus')
    : t('locationSelector.methodAutoStatus');
  const fontScalePreference =
    applicationSettings?.fontScale ?? FontScaleOption.MEDIUM;
  const fontScaleMultiplier = useMemo(
    () => getFontScaleMultiplier(fontScalePreference),
    [fontScalePreference],
  );
  const styles = useMemo(
    () => createStyles(fontScaleMultiplier),
    [fontScaleMultiplier],
  );

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SavedPlace[]>([]);
  const [methodModalState, setMethodModalState] = useState<{
    mode: 'existing' | 'new';
    key?: string;
    label: string;
  } | null>(null);
  const modalMethodInfo = useMemo(() => {
    if (!methodModalState) return null;
    if (methodModalState.mode === 'existing' && methodModalState.key) {
      return getMethodInfoForKey(methodModalState.key);
    }
    if (methodModalState.mode === 'new') {
      return newLocationMethodInfo;
    }
    return null;
  }, [getMethodInfoForKey, methodModalState, newLocationMethodInfo]);
  const query = search.trim();
  const hasQuery = query.length > 0;
  const [deviceLocationLabel, setDeviceLocationLabel] = useState<string | null>(
    null,
  );
  const [deviceLocationLoading, setDeviceLocationLoading] = useState(true);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<
    boolean | null
  >(null);
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

  useEffect(() => {
    if (!methodOptionsAvailable && methodModalState) {
      setMethodModalState(null);
    }
  }, [methodModalState, methodOptionsAvailable]);

  useEffect(() => {
    if (!hasQuery) {
      setNewLocationMethodPref({
        methodId: applicationSettings?.prayerTimeMethod ?? DEFAULT_METHOD_ID,
        manuallySet: false,
      });
      setMethodModalState(state =>
        state?.mode === 'new' ? null : state,
      );
    }
  }, [applicationSettings?.prayerTimeMethod, hasQuery]);

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
    if (hasQuery) {
      dispatch(
        updatePrayerTimeMethod({
          methodId: newLocationMethodPref.methodId,
          manuallySet: newLocationMethodPref.manuallySet,
          locationKey: p.id,
        }),
      );
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openMethodModalForExisting = useCallback(
    (key: string, label?: string) => {
      if (!methodOptionsAvailable) {
        return;
      }
      const resolvedLabel = label ?? getLocationLabelByKey(key);
      setMethodModalState({
        mode: 'existing',
        key,
        label: resolvedLabel,
      });
    },
    [getLocationLabelByKey, methodOptionsAvailable],
  );

  const openMethodModalForNew = useCallback(() => {
    if (!methodOptionsAvailable) {
      return;
    }
    setMethodModalState({
      mode: 'new',
      label: t('locationSelector.methodNewLocationTitle'),
    });
  }, [methodOptionsAvailable, t]);

  const handleMethodCardPress = useCallback(() => {
    openMethodModalForNew();
  }, [openMethodModalForNew]);

  const closeMethodModal = useCallback(() => {
    setMethodModalState(null);
  }, []);

  const handleManualMethodSelect = useCallback(
    (methodId: number) => {
      if (!methodModalState) return;
      if (methodModalState.mode === 'existing' && methodModalState.key) {
        dispatch(
          updatePrayerTimeMethod({
            methodId,
            manuallySet: true,
            locationKey: methodModalState.key,
          }),
        );
      } else if (methodModalState.mode === 'new') {
        setNewLocationMethodPref({
          methodId,
          manuallySet: true,
        });
      }
      closeMethodModal();
    },
    [
      closeMethodModal,
      dispatch,
      methodModalState,
    ],
  );

  const handleAutoMethodSelect = useCallback(() => {
    if (!methodModalState) return;
    if (methodModalState.mode === 'existing' && methodModalState.key) {
      const pref = getMethodPreferenceForKey(methodModalState.key);
      dispatch(
        updatePrayerTimeMethod({
          methodId: pref?.methodId ?? DEFAULT_METHOD_ID,
          manuallySet: false,
          locationKey: methodModalState.key,
        }),
      );
    } else if (methodModalState.mode === 'new') {
      setNewLocationMethodPref({
        methodId: applicationSettings?.prayerTimeMethod ?? DEFAULT_METHOD_ID,
        manuallySet: false,
      });
    }
    closeMethodModal();
  }, [
    closeMethodModal,
    dispatch,
    getMethodPreferenceForKey,
    methodModalState,
    applicationSettings?.prayerTimeMethod,
  ]);

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

  const renderMethodOption = ({
    item,
  }: {
    item: PrayerTimeMethodOption;
  }) => {
    const selected =
      !!modalMethodInfo?.pref?.manuallySet &&
      modalMethodInfo.pref.methodId === item.id;
    return (
      <Pressable
        style={styles.methodOptionRow}
        onPress={() => handleManualMethodSelect(item.id)}
      >
        <Text
          style={[styles.methodOptionTitle, { color: currentTheme.textColor }]}
        >
          {item.name}
        </Text>
        {selected && (
          <Icon
            type={Icons.MaterialDesignIcons}
            name="check"
            size={20}
            color={currentTheme.primary}
          />
        )}
      </Pressable>
    );
  };

  /** Renderers */
  const renderSaved = ({ item }: { item: SavedPlace }) => {
    const selected = isActiveId(item.id);
    const methodInfo = getMethodInfoForKey(item.id);
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
              <View style={styles.rowTextBlock}>
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
                {selected ? (
                  <View style={styles.methodInlineRow}>
                    <Text
                      style={[
                        styles.rowMethodText,
                        styles.methodInlineLabel,
                        { color: currentTheme.textColor },
                      ]}
                      numberOfLines={1}
                    >
                      {methodInfo.methodName}
                    </Text>
                    <Pressable
                      style={[
                        styles.methodInlineButton,
                        styles.methodInlineButtonLight,
                        { borderColor: currentTheme.primary },
                      ]}
                      onPress={event => {
                        event.stopPropagation();
                        openMethodModalForExisting(item.id, item.label);
                      }}
                    >
                      <Text
                        style={[
                          styles.methodInlineAction,
                          { color: currentTheme.primary },
                        ]}
                      >
                        {t('locationSelector.methodEditAction')}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.rowMethodText,
                      { color: currentTheme.textColor },
                    ]}
                    numberOfLines={1}
                  >
                    {t('locationSelector.methodRowDescription', {
                      method: methodInfo.methodName,
                      status: methodInfo.statusLabel,
                    })}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.rowRight}>
              {!selected && (
                <Pressable
                  style={styles.methodEditIconButton}
                  onPress={event => {
                    event.stopPropagation();
                    openMethodModalForExisting(item.id, item.label);
                  }}
                >
                  <Icon
                    type={Icons.MaterialDesignIcons}
                    name="tune-variant"
                    size={20}
                    color={currentTheme.textColor}
                  />
                </Pressable>
              )}
              {selected && (
                <SelectedBadge />
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
      <View style={styles.contentWrapper}>
        <View
          style={[styles.content, { paddingTop: headerOffset + 12 }]}
          onTouchStart={handleContentTouchStart}
        >
        {hasQuery && (
          <View style={styles.methodWrapper}>
            <Pressable
              style={[
                styles.methodCard,
                { backgroundColor: currentTheme.cardViewBackgroundColor },
                !methodOptionsAvailable && styles.methodCardDisabled,
              ]}
              onPress={handleMethodCardPress}
              disabled={!methodOptionsAvailable}
            >
              <View style={styles.methodCardTextBlock}>
                <Text
                  style={[
                    styles.methodCardLabel,
                    { color: currentTheme.textColor },
                  ]}
                >
                  {t('locationSelector.methodCardTitle', {
                    location: newLocationCardLabel,
                  })}
                </Text>
                <Text
                  style={[
                    styles.methodCardValue,
                    { color: currentTheme.textColor },
                  ]}
                  numberOfLines={2}
                >
                  {newMethodValueText}
                </Text>
                <Text
                  style={[
                    styles.methodCardHint,
                    { color: currentTheme.textColor },
                  ]}
                  numberOfLines={2}
                >
                  {newMethodHintText}
                </Text>
              </View>
              <View style={styles.methodCardRight}>
                <View
                  style={[
                    styles.methodStatusPill,
                    { backgroundColor: currentTheme.primary },
                  ]}
                >
                  <Text style={styles.methodStatusText}>
                    {newMethodStatusLabel}
                  </Text>
                </View>
                <Icon
                  type={Icons.MaterialDesignIcons}
                  name="chevron-down"
                  size={20}
                  color={currentTheme.textColor}
                />
              </View>
            </Pressable>
          </View>
        )}
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
                    <View style={styles.methodInlineRow}>
                      <Text
                        style={[styles.methodInlineLabel, styles.methodInlineLabelDark]}
                        numberOfLines={1}
                      >
                        {isActiveDevice
                          ? deviceMethodInfo.methodName
                          : t('locationSelector.methodRowDescription', {
                              method: deviceMethodInfo.methodName,
                              status: deviceMethodInfo.statusLabel,
                            })}
                      </Text>
                      <Pressable
                        style={[
                          styles.methodInlineButton,
                          styles.methodInlineButtonDark,
                        ]}
                        onPress={event => {
                          event.stopPropagation();
                          openMethodModalForExisting(
                            DEVICE_METHOD_KEY,
                            t('locationSelector.deviceTitle'),
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.methodInlineAction,
                            styles.methodInlineActionDark,
                          ]}
                        >
                          {t('locationSelector.methodEditAction')}
                        </Text>
                      </Pressable>
                    </View>
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
      </View>
      <BottomBannerAd />
      <Modal
        transparent
        animationType="fade"
        visible={!!methodModalState && methodOptionsAvailable}
        onRequestClose={closeMethodModal}
      >
        <View style={styles.methodModalOverlay}>
          <Pressable
            style={styles.methodModalBackdrop}
            onPress={closeMethodModal}
          />
          <View
            style={[
              styles.methodModalCard,
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
            >
              <Text
                style={[
                  styles.methodModalTitle,
                  { color: currentTheme.textColor },
                ]}
              >
                {t('locationSelector.methodModalTitle', {
                  location: methodModalState?.label ?? '',
                })}
              </Text>
              <Text
                style={[
                  styles.methodModalSubtitle,
                  { color: currentTheme.textColor },
                ]}
              >
                {t('locationSelector.methodModalSubtitle', {
                  location: methodModalState?.label ?? '',
                })}
              </Text>
              <Pressable
                style={[
                  styles.methodAutoCard,
                  { borderColor: currentTheme.primary },
                ]}
                onPress={handleAutoMethodSelect}
              >
                <View style={styles.methodOptionTextBlock}>
                  <Text
                    style={[
                      styles.methodOptionTitle,
                      { color: currentTheme.textColor },
                    ]}
                  >
                    {t('locationSelector.methodAutoOption')}
                  </Text>
                  <Text
                    style={[
                      styles.methodOptionSubtitle,
                      { color: currentTheme.textColor },
                    ]}
                  >
                    {t('locationSelector.methodAutoDescription', {
                      name:
                        modalMethodInfo?.methodName ??
                        t('locationSelector.methodUnknown'),
                      location:
                        methodModalState?.label ?? newLocationCardLabel,
                    })}
                  </Text>
                </View>
              {!modalMethodInfo?.pref?.manuallySet && (
                <Icon
                  type={Icons.MaterialDesignIcons}
                  name="check"
                  size={20}
                  color={currentTheme.primary}
                />
              )}
              </Pressable>
              <View
                style={[
                  styles.methodListDivider,
                  { backgroundColor: currentTheme.textColor, opacity: 0.15 },
                ]}
              />
              <FlatList
                style={styles.methodList}
                data={methodOptions}
                keyExtractor={item => String(item.id)}
                renderItem={renderMethodOption}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.methodOptionSeparator,
                    { backgroundColor: currentTheme.textColor, opacity: 0.15 },
                  ]}
                />
              )}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 4 }}
            />
          </View>
        </View>
      </Modal>
    </ScreenViewContainer>
  );
}

/** ---------- Styles ---------- */
const createStyles = (fontScaleMultiplier: number) => StyleSheet.create({
  contentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  methodWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  methodCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodCardDisabled: {
    opacity: 0.6,
  },
  methodCardTextBlock: {
    flex: 1,
    gap: 6,
  },
  methodCardLabel: {
    fontSize: 13 * fontScaleMultiplier,
    fontWeight: '600',
    opacity: 0.8,
  },
  methodCardValue: {
    fontSize: 16 * fontScaleMultiplier,
    fontWeight: '700',
  },
  methodCardHint: {
    fontSize: 12 * fontScaleMultiplier,
    opacity: 0.7,
  },
  methodCardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  methodStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  methodStatusText: {
    color: '#fff',
    fontSize: 12 * fontScaleMultiplier,
    fontWeight: '700',
  },
  methodInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  methodInlineLabel: {
    flex: 1,
    fontSize: 12 * fontScaleMultiplier,
  },
  methodInlineLabelDark: {
    color: 'rgba(255,255,255,0.9)',
  },
  methodInlineButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  methodInlineButtonDark: {
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  methodInlineButtonLight: {
    backgroundColor: 'transparent',
  },
  methodInlineAction: {
    fontSize: 12 * fontScaleMultiplier,
    fontWeight: '700',
  },
  methodInlineActionDark: {
    color: '#fff',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13 * fontScaleMultiplier,
    fontWeight: '700',
    opacity: 0.7,
  },

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
  nextLabel: {
    color: '#fff',
    fontSize: 16 * fontScaleMultiplier,
    fontWeight: '800',
  },
  nextHint: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13 * fontScaleMultiplier,
    marginTop: 2,
  },
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
    fontSize: 15 * fontScaleMultiplier,
    fontWeight: '700',
    marginBottom: 4,
  },
  permissionNoticeDescription: {
    fontSize: 13 * fontScaleMultiplier,
    lineHeight: 18 * fontScaleMultiplier,
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
    fontSize: 14 * fontScaleMultiplier,
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
  rowTextBlock: { flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7A8C99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: 15 * fontScaleMultiplier,
    fontWeight: '400',
  },
  rowTitleSelected: { fontWeight: '600' },
  rowMethodText: {
    fontSize: 12 * fontScaleMultiplier,
    opacity: 0.7,
    marginTop: 2,
  },
  methodEditIconButton: {
    padding: 6,
  },

  emptyText: { paddingHorizontal: 16, paddingVertical: 6, opacity: 0.6 },
  savedListContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  methodModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  methodModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  methodModalCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  methodModalTitle: {
    fontSize: 18 * fontScaleMultiplier,
    fontWeight: '700',
  },
  methodModalSubtitle: {
    fontSize: 13 * fontScaleMultiplier,
    opacity: 0.8,
  },
  methodAutoCard: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  methodOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  methodOptionTitle: {
    flex: 1,
    fontSize: 15 * fontScaleMultiplier,
    fontWeight: '500',
  },
  methodOptionSubtitle: {
    fontSize: 12 * fontScaleMultiplier,
    opacity: 0.75,
    marginTop: 4,
  },
  methodOptionTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  methodOptionSeparator: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  methodListDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 6,
  },
  methodList: {
    maxHeight: 320,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11 * fontScaleMultiplier,
    fontWeight: '700',
  },
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
    fontSize: 13 * fontScaleMultiplier,
    fontWeight: '600',
  },
});
