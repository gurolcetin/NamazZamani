import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  Animated,
  Dimensions,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../libs/core/providers';
import {
  BottomTabScreenViewContainer,
  FormSegmentedControl,
  Icon,
  Icons,
  PRAYER_TIME_ICONS,
} from '../../../libs/components';
import { RootState } from '../../../libs/redux/store';
import { FontScaleOption } from '../../../libs/common/enums';
import { getFontScaleMultiplier } from '../../../libs/core/helpers';
import { PrayerTimeKey } from '../../../libs/common/types';
import {
  addNotificationItem,
  removeNotificationItem,
  toggleNotificationItem,
  updateNotificationItem,
  NotificationItem,
  NotificationDays,
  NotificationSound,
} from '../../../libs/redux/reducers/AdvancedNotifications';
import { prayerNotificationManager } from '../../../libs/core/helpers/prayer-notification';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const PRAYER_GRADIENTS: Record<PrayerTimeKey, [string, string]> = {
  Fajr: ['#7B61FF', '#4D38C2'],
  Sunrise: ['#FFB340', '#FF6B35'],
  Dhuhr: ['#FFD60A', '#FF9500'],
  Asr: ['#FF9500', '#CC6600'],
  Maghrib: ['#FF6B35', '#CC2200'],
  Isha: ['#1B4FB8', '#0A2E6E'],
};

const SNOOZE_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

const SOUND_OPTIONS: NotificationSound[] = [
  'default',
  'ezan_sesi1',
  'ezan_sesi2',
  'ezan_sesi3',
  'zil_sesi_1',
  'zil_sesi_2',
  'zil_sesi_3',
];

const OFFSET_PRESETS = [-120, -90, -60, -45, -30, -20, -15, -10, -5, 5, 10, 15, 20, 30, 45, 60, 90, 120];

const DAY_LABELS_SHORT_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_LABELS_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS_LONG_TR = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
];
const DAY_LABELS_LONG_EN = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatOffset(offsetMinutes: number, t: (key: string, opts?: any) => string): string {
  if (offsetMinutes === 0) return t('notifications.detail.atPrayerTime');
  const abs = Math.abs(offsetMinutes);
  const hrs = Math.floor(abs / 60);
  const mins = abs % 60;
  let timeStr = '';
  if (hrs > 0 && mins > 0) {
    timeStr = `${hrs}s ${mins}dk`;
  } else if (hrs > 0) {
    timeStr = `${hrs} ${t('notifications.detail.hour')}`;
  } else {
    timeStr = `${mins} ${t('notifications.detail.minute')}`;
  }
  return offsetMinutes < 0
    ? t('notifications.detail.before', { time: timeStr })
    : t('notifications.detail.after', { time: timeStr });
}

function getNotifIcon(offsetMinutes: number): string {
  if (offsetMinutes < 0) return 'bell-outline';
  if (offsetMinutes === 0) return 'volume-high';
  return 'clock-outline';
}

export default function PrayerNotificationDetail() {
  const route = useRoute<any>();
  const { prayerKey } = route.params as { prayerKey: PrayerTimeKey };
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const fontScalePreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);

  const perPrayer = useSelector(
    (state: RootState) => state.advancedNotifications?.perPrayer ?? {},
  );

  const items: NotificationItem[] = useMemo(
    () => perPrayer[prayerKey] ?? [],
    [perPrayer, prayerKey],
  );

  const [selectedItemId, setSelectedItemId] = useState<string>(
    () => items[0]?.id ?? 'item_0',
  );
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectionModalType, setSelectionModalType] = useState<
    'sound' | 'snooze' | 'offset' | 'days' | null
  >(null);
  const [selectionModalTarget, setSelectionModalTarget] = useState<
    'selected' | 'add'
  >(
    'selected',
  );
  const [addOffsetMinutes, setAddOffsetMinutes] = useState<number>(-15);
  const [addOffsetDirection, setAddOffsetDirection] = useState<
    'before' | 'after'
  >('before');
  const [addSnoozeMinutes, setAddSnoozeMinutes] = useState<number>(0);
  const [addSoundOption, setAddSoundOption] = useState<NotificationSound>(
    'default',
  );
  const [addDays, setAddDays] = useState<NotificationDays>([
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const activeSoundRef = useRef<InstanceType<typeof Sound> | null>(null);

  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const selectedItem = useMemo(
    () => items.find(i => i.id === selectedItemId) ?? items[0],
    [items, selectedItemId],
  );

  const isLangTurkish = i18n.language?.startsWith('tr');
  const dayLabelsShort = isLangTurkish ? DAY_LABELS_SHORT_TR : DAY_LABELS_SHORT_EN;
  const dayLabelsLong = isLangTurkish ? DAY_LABELS_LONG_TR : DAY_LABELS_LONG_EN;
  const uc = useCallback(
    (s: string) => (isLangTurkish ? s.toLocaleUpperCase('tr-TR') : s.toUpperCase()),
    [isLangTurkish],
  );

  useEffect(() => {
    if (items.length > 0 && !items.find(i => i.id === selectedItemId)) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  const openAddSheet = useCallback(() => {
    setAddOffsetMinutes(-15);
    setAddOffsetDirection('before');
    setAddSnoozeMinutes(0);
    setAddSoundOption('default');
    setAddDays([true, true, true, true, true, true, true]);
    setSelectionModalType(null);
    setSelectionModalTarget('selected');
    setShowAddSheet(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [sheetAnim]);

  const closeAddSheet = useCallback(() => {
    setSelectionModalType(null);
    setSelectionModalTarget('selected');
    Animated.timing(sheetAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowAddSheet(false));
  }, [sheetAnim]);

  const prayerHasAnyEnabled = useMemo(
    () => items.some(i => i.enabled),
    [items],
  );

  const iconInfo = PRAYER_TIME_ICONS[prayerKey];
  const gradient = PRAYER_GRADIENTS[prayerKey];

  const handleTogglePrayer = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await prayerNotificationManager.requestPermission();
        if (!granted) {
          Alert.alert(
            t('notifications.permissionDeniedTitle'),
            t('notifications.permissionDeniedMessage'),
            [
              {
                text: t('notifications.goToSettingsButton'),
                onPress: () => Linking.openSettings().catch(() => {}),
              },
              { text: t('notifications.cancelButton'), style: 'cancel' },
            ],
          );
          return;
        }
      }
      items.forEach(item => {
        dispatch(toggleNotificationItem({ prayerKey, itemId: item.id, enabled: value }));
      });
    },
    [dispatch, items, prayerKey, t],
  );

  const handleToggleItem = useCallback(
    (itemId: string, enabled: boolean) => {
      dispatch(toggleNotificationItem({ prayerKey, itemId, enabled }));
    },
    [dispatch, prayerKey],
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (items.length <= 1) {
        return;
      }
      Alert.alert(
        t('notifications.detail.deleteTitle'),
        t('notifications.detail.deleteMessage'),
        [
          { text: t('notifications.cancelButton'), style: 'cancel' },
          {
            text: t('notifications.detail.deleteConfirm'),
            style: 'destructive',
            onPress: () => {
              if (selectedItemId === itemId) {
                const other = items.find(i => i.id !== itemId);
                if (other) setSelectedItemId(other.id);
              }
              dispatch(removeNotificationItem({ prayerKey, itemId }));
            },
          },
        ],
      );
    },
    [dispatch, items, prayerKey, selectedItemId, t],
  );

  const handleUpdateSnooze = useCallback(
    (snoozeMinutes: number) => {
      if (!selectedItem) return;
      dispatch(
        updateNotificationItem({
          prayerKey,
          item: { ...selectedItem, snoozeMinutes },
        }),
      );
    },
    [dispatch, prayerKey, selectedItem],
  );

  const getDaysByTarget = useCallback((): NotificationDays => {
    if (selectionModalTarget === 'add') {
      return addDays;
    }
    return (
      selectedItem?.days ?? [true, true, true, true, true, true, true]
    ) as NotificationDays;
  }, [addDays, selectionModalTarget, selectedItem]);

  const updateDaysByTarget = useCallback(
    (days: NotificationDays) => {
      if (selectionModalTarget === 'add') {
        setAddDays(days);
        return;
      }
      if (!selectedItem) return;
      dispatch(
        updateNotificationItem({
          prayerKey,
          item: { ...selectedItem, days },
        }),
      );
    },
    [dispatch, prayerKey, selectedItem, selectionModalTarget],
  );

  const modalDays = useMemo(() => getDaysByTarget(), [getDaysByTarget]);
  const allDaysActive = useMemo(() => modalDays.every(Boolean), [modalDays]);

  const handleUpdateOffset = useCallback(
    (offsetMinutes: number) => {
      if (!selectedItem) return;
      const exists = items.some(
        i => i.id !== selectedItem.id && i.offsetMinutes === offsetMinutes,
      );
      if (exists) {
        Alert.alert(
          t('notifications.detail.duplicateTitle'),
          t('notifications.detail.duplicateMessage'),
        );
        return;
      }
      dispatch(
        updateNotificationItem({
          prayerKey,
          item: { ...selectedItem, offsetMinutes },
        }),
      );
    },
    [dispatch, items, prayerKey, selectedItem, t],
  );

  const handlePreviewSound = useCallback(
    (sound: NotificationSound) => {
      // Stop any currently playing sound first
      if (activeSoundRef.current) {
        activeSoundRef.current.stop(() => {
          activeSoundRef.current?.release();
          activeSoundRef.current = null;
        });
        if (playingSound === sound) {
          // Same sound tapped again — just stop
          setPlayingSound(null);
          return;
        }
        setPlayingSound(null);
      }

      if (sound === 'default') return; // No preview for system default

      // Play custom sound (Android'de cihaz/packaging farkları için fallback denemeleri)
      const extension = sound.startsWith('ezan_sesi') ? 'wav' : 'mp3';
      const candidates: Array<{ filename: string; basePath: string }> =
        Platform.OS === 'android'
          ? [
              { filename: `${sound}.${extension}`, basePath: Sound.MAIN_BUNDLE },
              { filename: sound, basePath: Sound.MAIN_BUNDLE },
              { filename: sound, basePath: '' },
            ]
          : [{ filename: `${sound}.${extension}`, basePath: Sound.MAIN_BUNDLE }];
      const errors: string[] = [];

      const tryLoad = (index: number) => {
        if (index >= candidates.length) {
          console.warn(
            `[notification-sound-preview] Failed to load sound: ${sound}. Tried: ${errors.join(
              ' | ',
            )}`,
          );
          return;
        }

        const { filename, basePath } = candidates[index];
        const s = new Sound(filename, basePath, err => {
          if (err) {
            errors.push(`${basePath || '<empty>'}/${filename}`);
            s.release();
            tryLoad(index + 1);
            return;
          }
          activeSoundRef.current = s;
          setPlayingSound(sound);
          s.play(() => {
            setPlayingSound(null);
            activeSoundRef.current = null;
            s.release();
          });
        });
      };

      tryLoad(0);
    },
    [playingSound],
  );

  const handleUpdateSound = useCallback(
    (sound: NotificationSound) => {
      if (!selectedItem) return;
      dispatch(
        updateNotificationItem({
          prayerKey,
          item: { ...selectedItem, sound },
        }),
      );
    },
    [dispatch, prayerKey, selectedItem],
  );

  const openSoundSelector = useCallback(() => {
    setSelectionModalTarget('selected');
    setSelectionModalType('sound');
  }, []);

  const openAddSoundSelector = useCallback(() => {
    setSelectionModalTarget('add');
    setSelectionModalType('sound');
  }, []);

  const openSnoozeSelector = useCallback(() => {
    setSelectionModalTarget('selected');
    setSelectionModalType('snooze');
  }, []);

  const openAddSnoozeSelector = useCallback(() => {
    setSelectionModalTarget('add');
    setSelectionModalType('snooze');
  }, []);

  const openOffsetSelector = useCallback(() => {
    if (!selectedItem || selectedItem.offsetMinutes === 0) {
      return;
    }
    setSelectionModalTarget('selected');
    setSelectionModalType('offset');
  }, [selectedItem]);

  const openAddOffsetSelector = useCallback(() => {
    setAddOffsetDirection(addOffsetMinutes < 0 ? 'before' : 'after');
    setSelectionModalTarget('add');
    setSelectionModalType('offset');
  }, [addOffsetMinutes]);

  const handleSetAddOffsetDirection = useCallback(
    (nextDirection: 'before' | 'after') => {
      setAddOffsetDirection(nextDirection);
      const shouldBeBefore = nextDirection === 'before';
      const isBefore = addOffsetMinutes < 0;
      if (shouldBeBefore === isBefore) {
        return;
      }
      const abs = Math.abs(addOffsetMinutes);
      const mirrored = OFFSET_PRESETS.find(o =>
        shouldBeBefore ? o === -abs : o === abs,
      );
      if (mirrored != null) {
        setAddOffsetMinutes(mirrored);
        return;
      }
      setAddOffsetMinutes(shouldBeBefore ? -15 : 15);
    },
    [addOffsetMinutes],
  );

  const openDaysSelector = useCallback(() => {
    setSelectionModalTarget('selected');
    setSelectionModalType('days');
  }, []);

  const openAddDaysSelector = useCallback(() => {
    setSelectionModalTarget('add');
    setSelectionModalType('days');
  }, []);

  const closeSelectionModal = useCallback(() => {
    setSelectionModalType(null);
  }, []);

  const formatSnoozeLabel = useCallback(
    (minutes: number) =>
      minutes === 0
        ? t('notifications.detail.snoozeOff')
        : `${minutes}${t('notifications.detail.minuteShort')}`,
    [t],
  );

  const formatOffsetValue = useCallback(
    (minutes: number) => `${Math.abs(minutes)}${t('notifications.detail.minuteShort')}`,
    [t],
  );

  const formatDaysValue = useCallback(
    (days: NotificationDays) => {
      const activeIndices = days
        .map((enabled, index) => (enabled ? index : -1))
        .filter(index => index >= 0);
      if (activeIndices.length === 7) {
        return t('notifications.detail.allDaysSelected');
      }
      if (activeIndices.length === 0) {
        return t('notifications.detail.noDaysSelected');
      }
      return activeIndices.map(index => dayLabelsShort[index]).join(', ');
    },
    [dayLabelsShort, t],
  );

  const handleToggleDayInModal = useCallback(
    (dayIndex: number) => {
      const current = getDaysByTarget();
      const next = [...current] as NotificationDays;
      next[dayIndex] = !next[dayIndex];
      updateDaysByTarget(next);
    },
    [getDaysByTarget, updateDaysByTarget],
  );

  const handleToggleAllDaysInModal = useCallback(() => {
    const current = getDaysByTarget();
    const nextValue = !current.every(Boolean);
    updateDaysByTarget([
      nextValue,
      nextValue,
      nextValue,
      nextValue,
      nextValue,
      nextValue,
      nextValue,
    ] as NotificationDays);
  }, [getDaysByTarget, updateDaysByTarget]);

  const handleAddNotification = useCallback(() => {
    // Check if same offset already exists
    const exists = items.some(i => i.offsetMinutes === addOffsetMinutes);
    if (exists) {
      Alert.alert(
        t('notifications.detail.duplicateTitle'),
        t('notifications.detail.duplicateMessage'),
      );
      return;
    }
    const newId = `item_${Date.now()}`;
    const newItem: NotificationItem = {
      id: newId,
      offsetMinutes: addOffsetMinutes,
      enabled: true,
      sound: addSoundOption,
      snoozeMinutes: addSnoozeMinutes,
      days: addDays,
    };
    dispatch(addNotificationItem({ prayerKey, item: newItem }));
    setSelectedItemId(newId);
    closeAddSheet();
  }, [
    addDays,
    addOffsetMinutes,
    addSnoozeMinutes,
    addSoundOption,
    closeAddSheet,
    dispatch,
    items,
    prayerKey,
    t,
  ]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.offsetMinutes - b.offsetMinutes),
    [items],
  );

  const addOffsetDirectionOptions = useMemo(
    () => [
      {
        label: t('notifications.detail.beforeLabel'),
        value: 'before',
      },
      {
        label: t('notifications.detail.afterLabel'),
        value: 'after',
      },
    ],
    [t],
  );

  const isSelectionModalOpen = selectionModalType !== null;
  const showStandaloneSelectorModal =
    isSelectionModalOpen && selectionModalTarget === 'selected';
  const showAddSheetSelectorOverlay =
    showAddSheet && isSelectionModalOpen && selectionModalTarget === 'add';

  const styles = useMemo(
    () => createStyles(currentTheme, fontScaleMultiplier),
    [currentTheme, fontScaleMultiplier],
  );

  return (
    <BottomTabScreenViewContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Prayer header card */}
        <View style={styles.prayerHeaderCard}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.prayerIconBadge}
          >
            <Icon
              type={iconInfo.type}
              name={iconInfo.name as any}
              size={26 * fontScaleMultiplier}
              color="#FFFFFF"
            />
          </LinearGradient>
          <View style={styles.prayerHeaderContent}>
            <View style={styles.prayerHeaderTop}>
              <Text style={styles.prayerHeaderName}>
                {t(`prayerNames.${prayerKey}`)}
              </Text>
              {prayerHasAnyEnabled && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>
                    {t('notifications.hub.active')}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.prayerHeaderDesc}>
              {prayerHasAnyEnabled
                ? t('notifications.detail.prayerEnabledDesc')
                : t('notifications.detail.prayerDisabledDesc')}
            </Text>
          </View>
          <Switch
            value={prayerHasAnyEnabled}
            onValueChange={handleTogglePrayer}
            trackColor={{
              false: `${currentTheme.gray}33`,
              true: currentTheme.primary,
            }}
            thumbColor={currentTheme.white}
            ios_backgroundColor={`${currentTheme.gray}33`}
          />
        </View>

        {/* Notification flow */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {uc(t('notifications.detail.flowTitle'))}
          </Text>
          <Pressable
            onPress={openAddSheet}
            style={({ pressed }) => [
              styles.flowAddInlineButton,
              pressed && styles.flowAddInlineButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.detail.addButton')}
          >
            <Text style={styles.flowAddInlineText}>
              {t('notifications.detail.addButton')}
            </Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          {sortedItems.map((item, index) => {
            const isSelected = item.id === selectedItemId;
            const isLast = index === sortedItems.length - 1;
            return (
              <View key={item.id}>
                <Pressable
                  onPress={() => setSelectedItemId(item.id)}
                  style={({ pressed }) => [
                    styles.flowItem,
                    isSelected && styles.flowItemSelected,
                    !isLast && styles.flowItemBorder,
                    pressed && styles.flowItemPressed,
                  ]}
                  android_ripple={{
                    color: `${currentTheme.primary}15`,
                    borderless: false,
                  }}
                >
                  {/* Timeline connector */}
                  <View style={styles.flowConnectorWrap}>
                    <View
                      style={[
                        styles.flowConnectorDot,
                        isSelected && {
                          backgroundColor: currentTheme.primary,
                        },
                        item.offsetMinutes === 0 && styles.flowConnectorMain,
                      ]}
                    />
                    {!isLast && <View style={styles.flowConnectorLine} />}
                  </View>

                  <View
                    style={[
                      styles.flowIconBox,
                      isSelected && {
                        backgroundColor: currentTheme.primary + '22',
                      },
                    ]}
                  >
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name={getNotifIcon(item.offsetMinutes)}
                      size={18 * fontScaleMultiplier}
                      color={
                        isSelected
                          ? currentTheme.primary
                          : currentTheme.placeholderTextColor
                      }
                    />
                  </View>

                  <View style={styles.flowItemContent}>
                    <Text
                      style={[
                        styles.flowItemLabel,
                        isSelected && { color: currentTheme.primary },
                        item.offsetMinutes === 0 && styles.flowItemLabelMain,
                      ]}
                    >
                      {formatOffset(item.offsetMinutes, t)}
                    </Text>
                    {!item.enabled && (
                      <Text style={styles.flowItemDisabledLabel}>
                        {t('notifications.detail.disabled')}
                      </Text>
                    )}
                  </View>

                  <View style={styles.flowItemRight}>
                    {isSelected && (
                      <View style={styles.flowSelectedIndicator} />
                    )}
                    {items.length > 1 && item.offsetMinutes !== 0 && (
                      <Pressable
                        onPress={() => handleDeleteItem(item.id)}
                        style={styles.deleteButton}
                        hitSlop={8}
                      >
                        <Icon
                          type={Icons.MaterialDesignIcons}
                          name="trash-can-outline"
                          size={16 * fontScaleMultiplier}
                          color={currentTheme.systemRed}
                        />
                      </Pressable>
                    )}
                    <Switch
                      value={item.enabled}
                      onValueChange={v => handleToggleItem(item.id, v)}
                      trackColor={{
                        false: `${currentTheme.gray}33`,
                        true: currentTheme.primary,
                      }}
                      thumbColor={currentTheme.white}
                      ios_backgroundColor={`${currentTheme.gray}33`}
                      style={styles.flowItemSwitch}
                    />
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Settings for selected notification */}
        {selectedItem && selectedItem.enabled && (
          <>
            <Text style={styles.sectionTitle}>
              {uc(t('notifications.detail.settingsTitle'))}
            </Text>
            <View style={[styles.card, styles.settingsSelectedBorder]}>
              {/* Selected notification indicator */}
              <View style={styles.selectedNotifIndicator}>
                <Icon
                  type={Icons.MaterialDesignIcons}
                  name={getNotifIcon(selectedItem.offsetMinutes)}
                  size={14 * fontScaleMultiplier}
                  color={currentTheme.primary}
                />
                <Text style={styles.selectedNotifLabel}>
                  {formatOffset(selectedItem.offsetMinutes, t)}
                </Text>
              </View>

              <View style={styles.settingsListCard}>
                {/* Sound */}
                <Pressable
                  onPress={openSoundSelector}
                  style={({ pressed }) => [
                    styles.settingsListRow,
                    pressed && styles.settingsListRowPressed,
                  ]}
                >
                  <View style={styles.settingsRowLeft}>
                    <View style={styles.settingsIconBox}>
                      <Icon
                        type={Icons.MaterialDesignIcons}
                        name="volume-high"
                        size={18 * fontScaleMultiplier}
                        color={currentTheme.primary}
                      />
                    </View>
                    <View style={styles.settingsTextBlock}>
                      <Text style={styles.settingsRowLabel}>
                        {t('notifications.detail.sound')}
                      </Text>
                      <Text style={styles.settingsRowDescription}>
                        {t('notifications.detail.soundDescription')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.settingsRowRight}>
                    <Text numberOfLines={1} style={styles.settingsValueText}>
                      {t(`notifications.detail.sound_${selectedItem.sound}`)}
                    </Text>
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="chevron-right"
                      size={20 * fontScaleMultiplier}
                      color={currentTheme.placeholderTextColor}
                    />
                  </View>
                </Pressable>

                <View style={styles.settingsDivider} />

                {/* Snooze */}
                <Pressable
                  onPress={openSnoozeSelector}
                  style={({ pressed }) => [
                    styles.settingsListRow,
                    pressed && styles.settingsListRowPressed,
                  ]}
                >
                  <View style={styles.settingsRowLeft}>
                    <View style={styles.settingsIconBox}>
                      <Icon
                        type={Icons.MaterialDesignIcons}
                        name="timer-outline"
                        size={18 * fontScaleMultiplier}
                        color={currentTheme.primary}
                      />
                    </View>
                    <View style={styles.settingsTextBlock}>
                      <Text style={styles.settingsRowLabel}>
                        {t('notifications.detail.snooze')}
                      </Text>
                      <Text style={styles.settingsRowDescription}>
                        {t('notifications.detail.snoozeDescription')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.settingsRowRight}>
                    <Text numberOfLines={1} style={styles.settingsValueText}>
                      {formatSnoozeLabel(selectedItem.snoozeMinutes)}
                    </Text>
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="chevron-right"
                      size={20 * fontScaleMultiplier}
                      color={currentTheme.placeholderTextColor}
                    />
                  </View>
                </Pressable>

                {/* Offset editing – only for before/after notifications */}
                {selectedItem.offsetMinutes !== 0 && (
                  <>
                    <View style={styles.settingsDivider} />
                    <Pressable
                      onPress={openOffsetSelector}
                      style={({ pressed }) => [
                        styles.settingsListRow,
                        pressed && styles.settingsListRowPressed,
                      ]}
                    >
                      <View style={styles.settingsRowLeft}>
                        <View style={styles.settingsIconBox}>
                          <Icon
                            type={Icons.MaterialDesignIcons}
                            name="clock-edit-outline"
                            size={18 * fontScaleMultiplier}
                            color={currentTheme.primary}
                          />
                        </View>
                        <View style={styles.settingsTextBlock}>
                          <Text style={styles.settingsRowLabel}>
                            {selectedItem.offsetMinutes < 0
                              ? t('notifications.detail.beforeLabel')
                              : t('notifications.detail.afterLabel')}
                          </Text>
                          <Text style={styles.settingsRowDescription}>
                            {t('notifications.detail.offsetDescription')}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.settingsRowRight}>
                        <Text numberOfLines={1} style={styles.settingsValueText}>
                          {formatOffsetValue(selectedItem.offsetMinutes)}
                        </Text>
                        <Icon
                          type={Icons.MaterialDesignIcons}
                          name="chevron-right"
                          size={20 * fontScaleMultiplier}
                          color={currentTheme.placeholderTextColor}
                        />
                      </View>
                    </Pressable>
                  </>
                )}

                <View style={styles.settingsDivider} />
                <Pressable
                  onPress={openDaysSelector}
                  style={({ pressed }) => [
                    styles.settingsListRow,
                    pressed && styles.settingsListRowPressed,
                  ]}
                >
                  <View style={styles.settingsRowLeft}>
                    <View style={styles.settingsIconBox}>
                      <Icon
                        type={Icons.MaterialDesignIcons}
                        name="calendar-month-outline"
                        size={18 * fontScaleMultiplier}
                        color={currentTheme.primary}
                      />
                    </View>
                    <View style={styles.settingsTextBlock}>
                      <Text style={styles.settingsRowLabel}>
                        {t('notifications.detail.daysTitle')}
                      </Text>
                      <Text style={styles.settingsRowDescription}>
                        {t('notifications.detail.daysDescription')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.settingsRowRight}>
                    <Text numberOfLines={1} style={styles.settingsValueText}>
                      {formatDaysValue(selectedItem.days)}
                    </Text>
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="chevron-right"
                      size={20 * fontScaleMultiplier}
                      color={currentTheme.placeholderTextColor}
                    />
                  </View>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Selector modal (sound/snooze/offset/days) */}
      <Modal
        visible={showStandaloneSelectorModal}
        transparent
        animationType="fade"
        onRequestClose={closeSelectionModal}
      >
        <Pressable
          style={styles.selectorModalOverlay}
          onPress={closeSelectionModal}
        >
          <Pressable
            style={[
              styles.selectorModalCard,
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
            onPress={() => {}}
          >
            <Text style={styles.selectorModalTitle}>
              {selectionModalType === 'sound'
                ? t('notifications.detail.sound')
                : selectionModalType === 'snooze'
                ? t('notifications.detail.snooze')
                : selectionModalType === 'days'
                ? t('notifications.detail.daysTitle')
                : selectionModalTarget === 'add'
                ? t('notifications.detail.offsetDescription')
                : selectedItem?.offsetMinutes != null && selectedItem.offsetMinutes < 0
                ? t('notifications.detail.beforeLabel')
                : t('notifications.detail.afterLabel')}
            </Text>
            {selectionModalType === 'days' ? (
              <>
                <Pressable
                  onPress={handleToggleAllDaysInModal}
                  style={styles.daysModalToggleAll}
                >
                  <Text style={styles.daysModalToggleAllText}>
                    {allDaysActive
                      ? t('notifications.detail.disableAllDays')
                      : t('notifications.detail.activateAllDays')}
                  </Text>
                </Pressable>
                <ScrollView
                  style={styles.daysModalListScroll}
                  contentContainerStyle={styles.daysModalList}
                  showsVerticalScrollIndicator={false}
                >
                  {dayLabelsLong.map((label, index) => {
                    const isActive = modalDays[index];
                    return (
                      <Pressable
                        key={index}
                        onPress={() => handleToggleDayInModal(index)}
                        style={[
                          styles.daysModalRow,
                          isActive && styles.daysModalRowActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.daysModalRowText,
                            isActive && styles.daysModalRowTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                        {isActive && (
                          <Icon
                            type={Icons.MaterialDesignIcons}
                            name="check"
                            size={20 * fontScaleMultiplier}
                            color={currentTheme.primary}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable
                  onPress={closeSelectionModal}
                  style={[
                    styles.daysModalDoneButton,
                    { backgroundColor: currentTheme.primary },
                  ]}
                >
                  <Text style={styles.daysModalDoneText}>
                    {t('notifications.detail.modalDone')}
                  </Text>
                </Pressable>
              </>
            ) : (
              <ScrollView
                style={styles.selectorModalList}
                showsVerticalScrollIndicator={false}
              >
              {selectionModalType === 'sound'
                ? SOUND_OPTIONS.map(opt => {
                    const isSelected =
                      selectionModalTarget === 'add'
                        ? addSoundOption === opt
                        : selectedItem?.sound === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => {
                          if (selectionModalTarget === 'add') {
                            setAddSoundOption(opt);
                          } else {
                            handleUpdateSound(opt);
                          }
                          closeSelectionModal();
                        }}
                        style={[
                          styles.selectorOptionRow,
                          isSelected && styles.selectorOptionRowSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectorOptionText,
                            isSelected && styles.selectorOptionTextSelected,
                          ]}
                        >
                          {t(`notifications.detail.sound_${opt}`)}
                        </Text>
                        <View style={styles.selectorOptionActions}>
                          {opt !== 'default' && (
                            <Pressable
                              onPress={() => handlePreviewSound(opt)}
                              hitSlop={8}
                            >
                              <Icon
                                type={Icons.MaterialDesignIcons}
                                name={
                                  playingSound === opt
                                    ? 'stop-circle-outline'
                                    : 'play-circle-outline'
                                }
                                size={22 * fontScaleMultiplier}
                                color={
                                  isSelected
                                    ? currentTheme.primary
                                    : currentTheme.placeholderTextColor
                                }
                              />
                            </Pressable>
                          )}
                          {isSelected && (
                            <Icon
                              type={Icons.MaterialDesignIcons}
                              name="check"
                              size={20 * fontScaleMultiplier}
                              color={currentTheme.primary}
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  })
                : selectionModalType === 'snooze'
                ? SNOOZE_OPTIONS.map(opt => {
                    const isSelected =
                      selectionModalTarget === 'add'
                        ? addSnoozeMinutes === opt
                        : selectedItem?.snoozeMinutes === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => {
                          if (selectionModalTarget === 'add') {
                            setAddSnoozeMinutes(opt);
                          } else {
                            handleUpdateSnooze(opt);
                          }
                          closeSelectionModal();
                        }}
                        style={[
                          styles.selectorOptionRow,
                          isSelected && styles.selectorOptionRowSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectorOptionText,
                            isSelected && styles.selectorOptionTextSelected,
                          ]}
                        >
                          {formatSnoozeLabel(opt)}
                        </Text>
                        {isSelected && (
                          <Icon
                            type={Icons.MaterialDesignIcons}
                            name="check"
                            size={20 * fontScaleMultiplier}
                            color={currentTheme.primary}
                          />
                        )}
                      </Pressable>
                    );
                  })
                : OFFSET_PRESETS.filter(offset => {
                    if (selectionModalTarget === 'add') {
                      return offset !== 0;
                    }
                    return selectedItem?.offsetMinutes != null &&
                      selectedItem.offsetMinutes < 0
                      ? offset < 0
                      : offset > 0;
                  }).map(offset => {
                    const isSelected =
                      selectionModalTarget === 'add'
                        ? addOffsetMinutes === offset
                        : selectedItem?.offsetMinutes === offset;
                    return (
                      <Pressable
                        key={offset}
                        onPress={() => {
                          if (selectionModalTarget === 'add') {
                            setAddOffsetMinutes(offset);
                          } else {
                            handleUpdateOffset(offset);
                          }
                          closeSelectionModal();
                        }}
                        style={[
                          styles.selectorOptionRow,
                          isSelected && styles.selectorOptionRowSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectorOptionText,
                            isSelected && styles.selectorOptionTextSelected,
                          ]}
                        >
                          {selectionModalTarget === 'add'
                            ? formatOffset(offset, t)
                            : formatOffsetValue(offset)}
                        </Text>
                        {isSelected && (
                          <Icon
                            type={Icons.MaterialDesignIcons}
                            name="check"
                            size={20 * fontScaleMultiplier}
                            color={currentTheme.primary}
                          />
                        )}
                      </Pressable>
                    );
                  })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add notification bottom sheet */}
      {showAddSheet && (
        <Modal
          visible={showAddSheet}
          transparent
          animationType="none"
          onRequestClose={closeAddSheet}
        >
          <Pressable style={styles.sheetOverlay} onPress={closeAddSheet}>
            <Animated.View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: currentTheme.cardViewBackgroundColor,
                  transform: [{ translateY: sheetAnim }],
                },
              ]}
            >
              <Pressable onPress={() => {}}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>
                  {t('notifications.detail.addSheetTitle')}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {t('notifications.detail.addSheetSubtitle')}
                </Text>

                <View
                  style={[
                    styles.settingsListCard,
                    styles.addSheetSettingsListCard,
                  ]}
                >
                  <Pressable
                    onPress={openAddOffsetSelector}
                    style={({ pressed }) => [
                      styles.settingsListRow,
                      styles.addSheetSettingsListRow,
                      pressed && styles.settingsListRowPressed,
                    ]}
                  >
                    <View style={styles.settingsRowLeft}>
                      <View style={styles.settingsIconBox}>
                        <Icon
                          type={Icons.MaterialDesignIcons}
                          name="clock-edit-outline"
                          size={18 * fontScaleMultiplier}
                          color={currentTheme.primary}
                        />
                      </View>
                      <View style={styles.settingsTextBlock}>
                        <Text style={styles.settingsRowLabel}>
                          {t('notifications.detail.offsetDescription')}
                        </Text>
                        <Text style={styles.settingsRowDescription}>
                          {formatOffset(addOffsetMinutes, t)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.settingsRowRight}>
                      <Text numberOfLines={1} style={styles.settingsValueText}>
                        {formatOffset(addOffsetMinutes, t)}
                      </Text>
                      <Icon
                        type={Icons.MaterialDesignIcons}
                        name="chevron-right"
                        size={20 * fontScaleMultiplier}
                        color={currentTheme.placeholderTextColor}
                      />
                    </View>
                  </Pressable>

                  <View style={styles.settingsDivider} />

                  <Pressable
                    onPress={openAddSnoozeSelector}
                    style={({ pressed }) => [
                      styles.settingsListRow,
                      styles.addSheetSettingsListRow,
                      pressed && styles.settingsListRowPressed,
                    ]}
                  >
                    <View style={styles.settingsRowLeft}>
                      <View style={styles.settingsIconBox}>
                        <Icon
                          type={Icons.MaterialDesignIcons}
                          name="timer-outline"
                          size={18 * fontScaleMultiplier}
                          color={currentTheme.primary}
                        />
                      </View>
                      <View style={styles.settingsTextBlock}>
                        <Text style={styles.settingsRowLabel}>
                          {t('notifications.detail.snooze')}
                        </Text>
                        <Text style={styles.settingsRowDescription}>
                          {t('notifications.detail.snoozeDescription')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.settingsRowRight}>
                      <Text numberOfLines={1} style={styles.settingsValueText}>
                        {formatSnoozeLabel(addSnoozeMinutes)}
                      </Text>
                      <Icon
                        type={Icons.MaterialDesignIcons}
                        name="chevron-right"
                        size={20 * fontScaleMultiplier}
                        color={currentTheme.placeholderTextColor}
                      />
                    </View>
                  </Pressable>

                  <View style={styles.settingsDivider} />

                  <Pressable
                    onPress={openAddSoundSelector}
                    style={({ pressed }) => [
                      styles.settingsListRow,
                      styles.addSheetSettingsListRow,
                      pressed && styles.settingsListRowPressed,
                    ]}
                  >
                    <View style={styles.settingsRowLeft}>
                      <View style={styles.settingsIconBox}>
                        <Icon
                          type={Icons.MaterialDesignIcons}
                          name="volume-high"
                          size={18 * fontScaleMultiplier}
                          color={currentTheme.primary}
                        />
                      </View>
                      <View style={styles.settingsTextBlock}>
                        <Text style={styles.settingsRowLabel}>
                          {t('notifications.detail.sound')}
                        </Text>
                        <Text style={styles.settingsRowDescription}>
                          {t('notifications.detail.soundDescription')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.settingsRowRight}>
                      <Text numberOfLines={1} style={styles.settingsValueText}>
                        {t(`notifications.detail.sound_${addSoundOption}`)}
                      </Text>
                      <Icon
                        type={Icons.MaterialDesignIcons}
                        name="chevron-right"
                        size={20 * fontScaleMultiplier}
                        color={currentTheme.placeholderTextColor}
                      />
                    </View>
                  </Pressable>

                  <View style={styles.settingsDivider} />

                  <Pressable
                    onPress={openAddDaysSelector}
                    style={({ pressed }) => [
                      styles.settingsListRow,
                      styles.addSheetSettingsListRow,
                      pressed && styles.settingsListRowPressed,
                    ]}
                  >
                    <View style={styles.settingsRowLeft}>
                      <View style={styles.settingsIconBox}>
                        <Icon
                          type={Icons.MaterialDesignIcons}
                          name="calendar-month-outline"
                          size={18 * fontScaleMultiplier}
                          color={currentTheme.primary}
                        />
                      </View>
                      <View style={styles.settingsTextBlock}>
                        <Text style={styles.settingsRowLabel}>
                          {t('notifications.detail.daysTitle')}
                        </Text>
                        <Text style={styles.settingsRowDescription}>
                          {t('notifications.detail.daysDescription')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.settingsRowRight}>
                      <Text numberOfLines={1} style={styles.settingsValueText}>
                        {formatDaysValue(addDays)}
                      </Text>
                      <Icon
                        type={Icons.MaterialDesignIcons}
                        name="chevron-right"
                        size={20 * fontScaleMultiplier}
                        color={currentTheme.placeholderTextColor}
                      />
                    </View>
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleAddNotification}
                  style={({ pressed }) => [
                    styles.addConfirmButton,
                    { backgroundColor: currentTheme.primary },
                    pressed && styles.addConfirmButtonPressed,
                  ]}
                >
                  <Text style={styles.addConfirmButtonText}>
                    {t('notifications.detail.addConfirm')}
                  </Text>
                </Pressable>

              </Pressable>
            </Animated.View>
            {showAddSheetSelectorOverlay && (
              <Pressable
                style={styles.addSheetSelectorOverlay}
                onPress={closeSelectionModal}
              >
                <Pressable
                  style={[
                    styles.selectorModalCard,
                    { backgroundColor: currentTheme.cardViewBackgroundColor },
                  ]}
                  onPress={() => {}}
                >
                  <Text style={styles.selectorModalTitle}>
                    {selectionModalType === 'sound'
                      ? t('notifications.detail.sound')
                      : selectionModalType === 'snooze'
                      ? t('notifications.detail.snooze')
                      : selectionModalType === 'days'
                      ? t('notifications.detail.daysTitle')
                      : t('notifications.detail.offsetDescription')}
                  </Text>
                  {selectionModalType === 'days' ? (
                    <>
                      <Pressable
                        onPress={handleToggleAllDaysInModal}
                        style={styles.daysModalToggleAll}
                      >
                        <Text style={styles.daysModalToggleAllText}>
                          {allDaysActive
                            ? t('notifications.detail.disableAllDays')
                            : t('notifications.detail.activateAllDays')}
                        </Text>
                      </Pressable>
                      <ScrollView
                        style={styles.daysModalListScroll}
                        contentContainerStyle={styles.daysModalList}
                        showsVerticalScrollIndicator={false}
                      >
                        {dayLabelsLong.map((label, index) => {
                          const isActive = modalDays[index];
                          return (
                            <Pressable
                              key={index}
                              onPress={() => handleToggleDayInModal(index)}
                              style={[
                                styles.daysModalRow,
                                isActive && styles.daysModalRowActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.daysModalRowText,
                                  isActive && styles.daysModalRowTextActive,
                                ]}
                              >
                                {label}
                              </Text>
                              {isActive && (
                                <Icon
                                  type={Icons.MaterialDesignIcons}
                                  name="check"
                                  size={20 * fontScaleMultiplier}
                                  color={currentTheme.primary}
                                />
                              )}
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                      <Pressable
                        onPress={closeSelectionModal}
                        style={[
                          styles.daysModalDoneButton,
                          { backgroundColor: currentTheme.primary },
                        ]}
                      >
                        <Text style={styles.daysModalDoneText}>
                          {t('notifications.detail.modalDone')}
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      {selectionModalType === 'offset' && (
                        <View style={styles.offsetDirectionSegmentedWrap}>
                          <FormSegmentedControl
                            options={addOffsetDirectionOptions}
                            value={addOffsetDirection}
                            onChange={value =>
                              handleSetAddOffsetDirection(
                                value as 'before' | 'after',
                              )
                            }
                            compact
                            fontScaleMultiplier={fontScaleMultiplier}
                          />
                        </View>
                      )}
                      <ScrollView
                        style={styles.selectorModalList}
                        showsVerticalScrollIndicator={false}
                      >
                        {selectionModalType === 'sound'
                          ? SOUND_OPTIONS.map(opt => {
                              const isSelected = addSoundOption === opt;
                              return (
                                <Pressable
                                  key={opt}
                                  onPress={() => {
                                    setAddSoundOption(opt);
                                    closeSelectionModal();
                                  }}
                                  style={[
                                    styles.selectorOptionRow,
                                    isSelected && styles.selectorOptionRowSelected,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.selectorOptionText,
                                      isSelected &&
                                        styles.selectorOptionTextSelected,
                                    ]}
                                  >
                                    {t(`notifications.detail.sound_${opt}`)}
                                  </Text>
                                  <View style={styles.selectorOptionActions}>
                                    {opt !== 'default' && (
                                      <Pressable
                                        onPress={() => handlePreviewSound(opt)}
                                        hitSlop={8}
                                      >
                                        <Icon
                                          type={Icons.MaterialDesignIcons}
                                          name={
                                            playingSound === opt
                                              ? 'stop-circle-outline'
                                              : 'play-circle-outline'
                                          }
                                          size={22 * fontScaleMultiplier}
                                          color={
                                            isSelected
                                              ? currentTheme.primary
                                              : currentTheme.placeholderTextColor
                                          }
                                        />
                                      </Pressable>
                                    )}
                                    {isSelected && (
                                      <Icon
                                        type={Icons.MaterialDesignIcons}
                                        name="check"
                                        size={20 * fontScaleMultiplier}
                                        color={currentTheme.primary}
                                      />
                                    )}
                                  </View>
                                </Pressable>
                              );
                            })
                          : selectionModalType === 'snooze'
                          ? SNOOZE_OPTIONS.map(opt => {
                              const isSelected = addSnoozeMinutes === opt;
                              return (
                                <Pressable
                                  key={opt}
                                  onPress={() => {
                                    setAddSnoozeMinutes(opt);
                                    closeSelectionModal();
                                  }}
                                  style={[
                                    styles.selectorOptionRow,
                                    isSelected && styles.selectorOptionRowSelected,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.selectorOptionText,
                                      isSelected &&
                                        styles.selectorOptionTextSelected,
                                    ]}
                                  >
                                    {formatSnoozeLabel(opt)}
                                  </Text>
                                  {isSelected && (
                                    <Icon
                                      type={Icons.MaterialDesignIcons}
                                      name="check"
                                      size={20 * fontScaleMultiplier}
                                      color={currentTheme.primary}
                                    />
                                  )}
                                </Pressable>
                              );
                            })
                          : OFFSET_PRESETS.filter(offset =>
                              addOffsetDirection === 'before'
                                ? offset < 0
                                : offset > 0,
                            ).map(offset => {
                              const isSelected = addOffsetMinutes === offset;
                              return (
                                <Pressable
                                  key={offset}
                                  onPress={() => {
                                    setAddOffsetMinutes(offset);
                                    setAddOffsetDirection(
                                      offset < 0 ? 'before' : 'after',
                                    );
                                    closeSelectionModal();
                                  }}
                                  style={[
                                    styles.selectorOptionRow,
                                    isSelected && styles.selectorOptionRowSelected,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.selectorOptionText,
                                      isSelected &&
                                        styles.selectorOptionTextSelected,
                                    ]}
                                  >
                                    {formatOffset(offset, t)}
                                  </Text>
                                  {isSelected && (
                                    <Icon
                                      type={Icons.MaterialDesignIcons}
                                      name="check"
                                      size={20 * fontScaleMultiplier}
                                      color={currentTheme.primary}
                                    />
                                  )}
                                </Pressable>
                              );
                            })}
                      </ScrollView>
                    </>
                  )}
                </Pressable>
              </Pressable>
            )}
          </Pressable>
        </Modal>
      )}
    </BottomTabScreenViewContainer>
  );
}

const createStyles = (theme: any, fsm: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
      paddingTop: 8,
    },
    prayerHeaderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardViewBackgroundColor,
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
      gap: 12,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    prayerIconBadge: {
      width: 48 * fsm,
      height: 48 * fsm,
      borderRadius: 12 * fsm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    prayerHeaderContent: {
      flex: 1,
      justifyContent: 'center',
    },
    prayerHeaderTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    prayerHeaderName: {
      fontSize: 18 * fsm,
      fontWeight: '700',
      color: theme.textColor,
    },
    activeBadge: {
      backgroundColor: theme.primary + '22',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    activeBadgeText: {
      fontSize: 11 * fsm,
      color: theme.primary,
      fontWeight: '600',
    },
    prayerHeaderDesc: {
      fontSize: 12 * fsm,
      color: theme.placeholderTextColor,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 13 * fsm,
      fontWeight: '600',
      color: theme.placeholderTextColor,
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    flowAddInlineButton: {
      paddingHorizontal: 6,
      paddingVertical: 4,
      marginRight: 2,
      marginBottom: 6,
    },
    flowAddInlineButtonPressed: {
      opacity: 0.65,
    },
    flowAddInlineText: {
      fontSize: 13 * fsm,
      fontWeight: '600',
      color: theme.primary,
    },
    card: {
      backgroundColor: theme.cardViewBackgroundColor,
      borderRadius: 14,
      marginBottom: 12,
      overflow: 'hidden',
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    // Flow
    flowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      gap: 10,
    },
    flowItemSelected: {
      backgroundColor: theme.primary + '0A',
    },
    flowItemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.gray + '40',
    },
    flowItemPressed: {
      opacity: 0.75,
    },
    flowConnectorWrap: {
      alignItems: 'center',
      width: 14,
    },
    flowConnectorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.gray + '80',
    },
    flowConnectorMain: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.primary + '80',
    },
    flowConnectorLine: {
      position: 'absolute',
      top: 10,
      width: 2,
      height: '100%',
      backgroundColor: theme.gray + '30',
    },
    flowIconBox: {
      width: 34 * fsm,
      height: 34 * fsm,
      borderRadius: 8 * fsm,
      backgroundColor: theme.inputBackgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flowItemContent: {
      flex: 1,
    },
    flowItemLabel: {
      fontSize: 14 * fsm,
      color: theme.textColor,
      fontWeight: '500',
    },
    flowItemLabelMain: {
      fontWeight: '700',
    },
    flowItemDisabledLabel: {
      fontSize: 11 * fsm,
      color: theme.placeholderTextColor,
    },
    flowItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    flowSelectedIndicator: {
      width: 4,
      height: 24,
      borderRadius: 2,
      backgroundColor: theme.primary,
    },
    deleteButton: {
      padding: 4,
    },
    flowItemSwitch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    // Settings
    settingsSelectedBorder: {
      borderWidth: 1,
      borderColor: theme.gray + '30',
    },
    selectedNotifIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
    },
    selectedNotifLabel: {
      fontSize: 12 * fsm,
      color: theme.primary,
      fontWeight: '600',
    },
    settingsListCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.gray + '35',
      marginHorizontal: 12,
      marginTop: 4,
      marginBottom: 12,
      overflow: 'hidden',
      backgroundColor: theme.cardViewBackgroundColor,
    },
    addSheetSettingsListCard: {
      borderWidth: 0,
      marginHorizontal: 0,
      marginTop: 0,
      marginBottom: 4,
      backgroundColor: 'transparent',
    },
    settingsListRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    addSheetSettingsListRow: {
      paddingHorizontal: 6,
    },
    settingsListRowPressed: {
      backgroundColor: theme.primary + '08',
    },
    settingsRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    settingsTextBlock: {
      flex: 1,
      justifyContent: 'center',
    },
    settingsIconBox: {
      width: 32 * fsm,
      height: 32 * fsm,
      borderRadius: 8 * fsm,
      backgroundColor: theme.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsRowLabel: {
      fontSize: 14 * fsm,
      color: theme.textColor,
      fontWeight: '600',
      flexShrink: 1,
    },
    settingsRowDescription: {
      fontSize: 11 * fsm,
      color: theme.placeholderTextColor,
      marginTop: 2,
    },
    settingsRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      maxWidth: '42%',
      flexShrink: 1,
    },
    settingsValueText: {
      fontSize: 13 * fsm,
      color: theme.primary,
      fontWeight: '600',
    },
    settingsDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.gray + '40',
      marginHorizontal: 16,
    },
    selectorModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    addSheetSelectorOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 20,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    selectorModalCard: {
      width: '100%',
      borderRadius: 16,
      padding: 14,
      maxHeight: SCREEN_HEIGHT * 0.64,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    selectorModalTitle: {
      fontSize: 17 * fsm,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 10,
    },
    daysModalToggleAll: {
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.primary + '10',
      marginBottom: 10,
      alignItems: 'center',
    },
    daysModalToggleAllText: {
      fontSize: 13 * fsm,
      color: theme.primary,
      fontWeight: '700',
    },
    daysModalList: {
      gap: 8,
      paddingBottom: 4,
    },
    daysModalListScroll: {
      maxHeight: SCREEN_HEIGHT * 0.5,
      marginBottom: 12,
    },
    daysModalRow: {
      minHeight: 44,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.inputBackgroundColor,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    daysModalRowActive: {
      backgroundColor: theme.primary + '14',
      borderWidth: 1.2,
      borderColor: theme.primary + '88',
    },
    daysModalRowText: {
      flex: 1,
      fontSize: 14 * fsm,
      color: theme.textColor,
      fontWeight: '500',
    },
    daysModalRowTextActive: {
      color: theme.primary,
      fontWeight: '700',
    },
    daysModalDoneButton: {
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    daysModalDoneText: {
      fontSize: 14 * fsm,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    selectorModalList: {
      maxHeight: SCREEN_HEIGHT * 0.52,
    },
    offsetDirectionSegmentedWrap: {
      marginBottom: 10,
    },
    selectorOptionRow: {
      minHeight: 44,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.inputBackgroundColor,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      gap: 10,
    },
    selectorOptionRowSelected: {
      backgroundColor: theme.primary + '14',
      borderWidth: 1.2,
      borderColor: theme.primary + '88',
    },
    selectorOptionText: {
      flex: 1,
      fontSize: 14 * fsm,
      color: theme.textColor,
      fontWeight: '500',
    },
    selectorOptionTextSelected: {
      color: theme.primary,
      fontWeight: '700',
    },
    selectorOptionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    // Bottom sheet
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 12,
      paddingBottom: 40,
      paddingTop: 12,
      maxHeight: SCREEN_HEIGHT * 0.75,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.gray + '60',
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetTitle: {
      fontSize: 18 * fsm,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 4,
    },
    sheetSubtitle: {
      fontSize: 13 * fsm,
      color: theme.placeholderTextColor,
      marginBottom: 16,
    },
    offsetSectionLabel: {
      fontSize: 13 * fsm,
      fontWeight: '600',
      color: theme.placeholderTextColor,
      letterSpacing: 0.4,
      marginBottom: 8,
    },
    addConfirmButton: {
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    addConfirmButtonPressed: {
      opacity: 0.8,
    },
    addConfirmButtonText: {
      fontSize: 16 * fsm,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
