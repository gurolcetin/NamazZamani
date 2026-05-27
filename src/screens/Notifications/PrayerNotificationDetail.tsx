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
import { BottomTabScreenViewContainer, Icon, Icons, PRAYER_TIME_ICONS } from '../../../libs/components';
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

const SOUND_OPTIONS = ['default', 'big_bell'] as const;

const OFFSET_PRESETS = [-120, -90, -60, -45, -30, -20, -15, -10, -5, 5, 10, 15, 20, 30, 45, 60, 90, 120];

const DAY_LABELS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const [addOffsetMinutes, setAddOffsetMinutes] = useState<number>(-15);
  const [addSnoozeMinutes, setAddSnoozeMinutes] = useState<number>(0);
  const [addSoundOption, setAddSoundOption] = useState<'default' | 'big_bell'>('default');
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const activeSoundRef = useRef<InstanceType<typeof Sound> | null>(null);

  const beforeScrollRef = useRef<ScrollView>(null);
  const afterScrollRef = useRef<ScrollView>(null);
  const beforeChipLayoutRef = useRef<Record<number, number>>({});
  const afterChipLayoutRef = useRef<Record<number, number>>({});
  const settingsOffsetScrollRef = useRef<ScrollView>(null);
  const settingsOffsetChipLayoutRef = useRef<Record<number, number>>({});

  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const selectedItem = useMemo(
    () => items.find(i => i.id === selectedItemId) ?? items[0],
    [items, selectedItemId],
  );

  const isLangTurkish = i18n.language?.startsWith('tr');
  const dayLabels = isLangTurkish ? DAY_LABELS_TR : DAY_LABELS_EN;
  const uc = useCallback(
    (s: string) => (isLangTurkish ? s.toLocaleUpperCase('tr-TR') : s.toUpperCase()),
    [isLangTurkish],
  );

  useEffect(() => {
    if (items.length > 0 && !items.find(i => i.id === selectedItemId)) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  useEffect(() => {
    if (!showAddSheet) return;
    const timeout = setTimeout(() => {
      const isNeg = addOffsetMinutes < 0;
      const map = isNeg ? beforeChipLayoutRef.current : afterChipLayoutRef.current;
      const x = map[addOffsetMinutes];
      if (x != null) {
        const ref = isNeg ? beforeScrollRef : afterScrollRef;
        ref.current?.scrollTo({ x: Math.max(0, x - 80), animated: true });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [showAddSheet, addOffsetMinutes]);

  useEffect(() => {
    if (!selectedItem || selectedItem.offsetMinutes === 0) return;
    const timeout = setTimeout(() => {
      const x = settingsOffsetChipLayoutRef.current[selectedItem.offsetMinutes];
      if (x != null) {
        settingsOffsetScrollRef.current?.scrollTo({ x: Math.max(0, x - 80), animated: true });
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [selectedItem, selectedItem.id, selectedItem.offsetMinutes]);

  const openAddSheet = useCallback(() => {
    setAddOffsetMinutes(-15);
    setAddSnoozeMinutes(0);
    setAddSoundOption('default');
    setShowAddSheet(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [sheetAnim]);

  const closeAddSheet = useCallback(() => {
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

  const handleToggleDay = useCallback(
    (dayIndex: number) => {
      if (!selectedItem) return;
      const newDays = [...selectedItem.days] as NotificationDays;
      newDays[dayIndex] = !newDays[dayIndex];
      dispatch(
        updateNotificationItem({
          prayerKey,
          item: { ...selectedItem, days: newDays },
        }),
      );
    },
    [dispatch, prayerKey, selectedItem],
  );

  const allDaysActive = useMemo(
    () => selectedItem?.days?.every(d => d) ?? true,
    [selectedItem],
  );

  const handleToggleAllDays = useCallback(() => {
    if (!selectedItem) return;
    const next = !allDaysActive;
    const newDays = [next, next, next, next, next, next, next] as NotificationDays;
    dispatch(
      updateNotificationItem({
        prayerKey,
        item: { ...selectedItem, days: newDays },
      }),
    );
  }, [allDaysActive, dispatch, prayerKey, selectedItem]);

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
    (sound: 'default' | 'big_bell') => {
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

      // Play custom sound
      const filename = Platform.OS === 'android' ? sound : `${sound}.mp3`;
      const basePath = Platform.OS === 'android' ? undefined : Sound.MAIN_BUNDLE;
      const s = new Sound(filename, basePath, err => {
        if (err) return;
        activeSoundRef.current = s;
        setPlayingSound(sound);
        s.play(() => {
          setPlayingSound(null);
          activeSoundRef.current = null;
          s.release();
        });
      });
    },
    [playingSound],
  );

  const handleUpdateSound = useCallback(
    (sound: 'default' | 'big_bell') => {
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
      days: [true, true, true, true, true, true, true],
    };
    dispatch(addNotificationItem({ prayerKey, item: newItem }));
    setSelectedItemId(newId);
    closeAddSheet();
  }, [addOffsetMinutes, addSnoozeMinutes, addSoundOption, closeAddSheet, dispatch, items, prayerKey, t]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.offsetMinutes - b.offsetMinutes),
    [items],
  );

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
        <Text style={styles.sectionTitle}>
          {uc(t('notifications.detail.flowTitle'))}
        </Text>
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

        {/* Add notification button */}
        <Pressable
          onPress={openAddSheet}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
        >
          <Icon
            type={Icons.MaterialDesignIcons}
            name="plus"
            size={18 * fontScaleMultiplier}
            color={currentTheme.primary}
          />
          <Text style={styles.addButtonText}>
            {t('notifications.detail.addButton')}
          </Text>
        </Pressable>

        {/* Settings for selected notification */}
        {selectedItem && (
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

              {/* Sound */}
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <View style={styles.settingsIconBox}>
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="volume-high"
                      size={18 * fontScaleMultiplier}
                      color={currentTheme.primary}
                    />
                  </View>
                  <Text style={styles.settingsRowLabel}>
                    {t('notifications.detail.sound')}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.snoozeRow}
                >
                    {SOUND_OPTIONS.map(opt => (
                    <Pressable
                      key={opt}
                      onPress={() => handleUpdateSound(opt)}
                      style={[
                        styles.snoozeChip,
                        selectedItem.sound === opt && styles.snoozeChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.snoozeChipText,
                          selectedItem.sound === opt &&
                            styles.snoozeChipTextSelected,
                        ]}
                      >
                        {t(`notifications.detail.sound_${opt}`)}
                      </Text>
                      {opt !== 'default' && (
                        <Pressable
                          onPress={() => handlePreviewSound(opt)}
                          hitSlop={6}
                          style={styles.soundPreviewBtn}
                        >
                          <Icon
                            type={Icons.MaterialDesignIcons}
                            name={
                              playingSound === opt
                                ? 'stop-circle-outline'
                                : 'play-circle-outline'
                            }
                            size={24 * fontScaleMultiplier}
                            color={
                              selectedItem.sound === opt
                                ? currentTheme.primary
                                : currentTheme.placeholderTextColor
                            }
                          />
                        </Pressable>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.settingsDivider} />

              {/* Snooze */}
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <View style={styles.settingsIconBox}>
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="timer-outline"
                      size={18 * fontScaleMultiplier}
                      color={currentTheme.primary}
                    />
                  </View>
                  <Text style={styles.settingsRowLabel}>
                    {t('notifications.detail.snooze')}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.snoozeRow}
                >
                  {SNOOZE_OPTIONS.map(opt => (
                    <Pressable
                      key={opt}
                      onPress={() => handleUpdateSnooze(opt)}
                      style={[
                        styles.snoozeChip,
                        selectedItem.snoozeMinutes === opt &&
                          styles.snoozeChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.snoozeChipText,
                          selectedItem.snoozeMinutes === opt &&
                            styles.snoozeChipTextSelected,
                        ]}
                      >
                        {opt === 0
                          ? t('notifications.detail.snoozeOff')
                          : `${opt}${t('notifications.detail.minuteShort')}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Offset editing – only for before/after notifications */}
              {selectedItem.offsetMinutes !== 0 && (
                <>
                  <View style={styles.settingsDivider} />
                  <View style={styles.settingsRow}>
                    <View style={styles.settingsRowLeft}>
                      <View style={styles.settingsIconBox}>
                        <Icon
                          type={Icons.MaterialDesignIcons}
                          name="clock-edit-outline"
                          size={18 * fontScaleMultiplier}
                          color={currentTheme.primary}
                        />
                      </View>
                      <Text style={styles.settingsRowLabel}>
                        {selectedItem.offsetMinutes < 0
                          ? t('notifications.detail.beforeLabel')
                          : t('notifications.detail.afterLabel')}
                      </Text>
                    </View>
                    <ScrollView
                      ref={settingsOffsetScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.snoozeRow}
                    >
                      {OFFSET_PRESETS.filter(o =>
                        selectedItem.offsetMinutes < 0 ? o < 0 : o > 0,
                      ).map(offset => (
                        <Pressable
                          key={offset}
                          onPress={() => handleUpdateOffset(offset)}
                          onLayout={e => {
                            settingsOffsetChipLayoutRef.current[offset] = e.nativeEvent.layout.x;
                          }}
                          style={[
                            styles.snoozeChip,
                            selectedItem.offsetMinutes === offset &&
                              styles.snoozeChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.snoozeChipText,
                              selectedItem.offsetMinutes === offset &&
                                styles.snoozeChipTextSelected,
                            ]}
                          >
                            {Math.abs(offset)}
                            {t('notifications.detail.minuteShort')}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}
            </View>

            {/* Days section */}
            <View style={styles.daysSectionHeader}>
              <Text style={styles.sectionTitle}>
                {uc(t('notifications.detail.daysTitle'))}
              </Text>
              <Pressable onPress={handleToggleAllDays}>
                <Text style={styles.daysAllText}>
                  {allDaysActive
                    ? t('notifications.detail.allDaysActive')
                    : t('notifications.detail.activateAllDays')}
                </Text>
              </Pressable>
            </View>
            <View style={[styles.card, styles.daysCard]}>
              {dayLabels.map((label, index) => {
                const isActive = selectedItem.days?.[index] ?? true;
                return (
                  <Pressable
                    key={index}
                    onPress={() => handleToggleDay(index)}
                    style={[
                      styles.dayChip,
                      isActive && styles.dayChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        isActive && styles.dayChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

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

                <Text style={styles.offsetSectionLabel}>
                  {uc(t('notifications.detail.beforeLabel'))}
                </Text>
                <ScrollView
                  ref={beforeScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offsetRow}
                >
                  {OFFSET_PRESETS.filter(o => o < 0).map(offset => (
                    <Pressable
                      key={offset}
                      onPress={() => setAddOffsetMinutes(offset)}
                      onLayout={e => {
                        beforeChipLayoutRef.current[offset] = e.nativeEvent.layout.x;
                      }}
                      style={[
                        styles.offsetChip,
                        addOffsetMinutes === offset && styles.offsetChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.offsetChipText,
                          addOffsetMinutes === offset &&
                            styles.offsetChipTextSelected,
                        ]}
                      >
                        {Math.abs(offset)}
                        {t('notifications.detail.minuteShort')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.offsetSectionLabel}>
                  {uc(t('notifications.detail.afterLabel'))}
                </Text>
                <ScrollView
                  ref={afterScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offsetRow}
                >
                  {OFFSET_PRESETS.filter(o => o > 0).map(offset => (
                    <Pressable
                      key={offset}
                      onPress={() => setAddOffsetMinutes(offset)}
                      onLayout={e => {
                        afterChipLayoutRef.current[offset] = e.nativeEvent.layout.x;
                      }}
                      style={[
                        styles.offsetChip,
                        addOffsetMinutes === offset && styles.offsetChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.offsetChipText,
                          addOffsetMinutes === offset &&
                            styles.offsetChipTextSelected,
                        ]}
                      >
                        {offset}
                        {t('notifications.detail.minuteShort')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.sheetDivider} />
                <Text style={styles.offsetSectionLabel}>
                  {uc(t('notifications.detail.snooze'))}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offsetRow}
                >
                  {SNOOZE_OPTIONS.map(opt => (
                    <Pressable
                      key={opt}
                      onPress={() => setAddSnoozeMinutes(opt)}
                      style={[
                        styles.snoozeChip,
                        addSnoozeMinutes === opt && styles.snoozeChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.snoozeChipText,
                          addSnoozeMinutes === opt &&
                            styles.snoozeChipTextSelected,
                        ]}
                      >
                        {opt === 0
                          ? t('notifications.detail.snoozeOff')
                          : `${opt}${t('notifications.detail.minuteShort')}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.sheetDivider} />
                <Text style={styles.offsetSectionLabel}>
                  {uc(t('notifications.detail.sound'))}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offsetRow}
                >
                  {SOUND_OPTIONS.map(opt => (
                    <Pressable
                      key={opt}
                      onPress={() => setAddSoundOption(opt)}
                      style={[
                        styles.snoozeChip,
                        addSoundOption === opt && styles.snoozeChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.snoozeChipText,
                          addSoundOption === opt && styles.snoozeChipTextSelected,
                        ]}
                      >
                        {t(`notifications.detail.sound_${opt}`)}
                      </Text>
                      {opt !== 'default' && (
                        <Pressable
                          onPress={() => handlePreviewSound(opt)}
                          hitSlop={6}
                          style={styles.soundPreviewBtn}
                        >
                          <Icon
                            type={Icons.MaterialDesignIcons}
                            name={
                              playingSound === opt
                                ? 'stop-circle-outline'
                                : 'play-circle-outline'
                            }
                            size={16 * fontScaleMultiplier}
                            color={
                              addSoundOption === opt
                                ? currentTheme.primary
                                : currentTheme.placeholderTextColor
                            }
                          />
                        </Pressable>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.selectedOffsetPreview}>
                  {formatOffset(addOffsetMinutes, t)}
                </Text>
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
    // Add button
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 15,
      marginBottom: 20,
      backgroundColor: theme.cardViewBackgroundColor,
      borderWidth: 1.5,
      borderColor: theme.primary + '50',
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    addButtonPressed: {
      opacity: 0.7,
    },
    addButtonText: {
      fontSize: 15 * fsm,
      color: theme.primary,
      fontWeight: '600',
    },
    // Settings
    settingsSelectedBorder: {
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
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
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
    },
    settingsRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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
      fontWeight: '500',
    },
    settingsRowValue: {
      fontSize: 14 * fsm,
      color: theme.placeholderTextColor,
    },
    settingsDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.gray + '40',
      marginHorizontal: 16,
    },
    snoozeRow: {
      gap: 6,
      paddingVertical: 2,
    },
    snoozeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.inputBackgroundColor,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    snoozeChipSelected: {
      backgroundColor: theme.primary + '12',
      borderColor: theme.primary,
    },
    snoozeChipText: {
      fontSize: 12 * fsm,
      color: theme.textColor,
      fontWeight: '500',
    },
    snoozeChipTextSelected: {
      color: theme.primary,
      fontWeight: '700',
    },
    soundPreviewBtn: {
      marginLeft: 2,
    },
    // Days
    daysSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      marginLeft: 4,
    },
    daysAllText: {
      fontSize: 13 * fsm,
      color: theme.primary,
      fontWeight: '600',
    },
    daysCard: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 12,
      gap: 8,
    },
    dayChip: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: theme.inputBackgroundColor,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    dayChipActive: {
      backgroundColor: theme.primary + '12',
      borderColor: theme.primary,
    },
    dayChipText: {
      fontSize: 13 * fsm,
      color: theme.placeholderTextColor,
      fontWeight: '500',
    },
    dayChipTextActive: {
      color: theme.primary,
      fontWeight: '700',
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
      paddingHorizontal: 16,
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
    sheetDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.gray + '40',
      marginVertical: 12,
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
    offsetRow: {
      gap: 8,
      paddingBottom: 12,
    },
    offsetChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: theme.inputBackgroundColor,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    offsetChipSelected: {
      backgroundColor: theme.primary + '18',
      borderColor: theme.primary,
    },
    offsetChipText: {
      fontSize: 13 * fsm,
      color: theme.textColor,
      fontWeight: '500',
    },
    offsetChipTextSelected: {
      color: theme.primary,
      fontWeight: '700',
    },
    selectedOffsetPreview: {
      fontSize: 16 * fsm,
      fontWeight: '600',
      color: theme.primary,
      textAlign: 'center',
      marginVertical: 12,
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
