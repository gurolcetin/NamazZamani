import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  setSilentMode,
  toggleAllPrayerNotifications,
  SilentModeDuration,
} from '../../../libs/redux/reducers/AdvancedNotifications';
import { ToolsRoutes } from '../../navigation/Routes';
import { prayerNotificationManager } from '../../../libs/core/helpers/prayer-notification';

const PRAYER_ORDER: PrayerTimeKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

const PRAYER_GRADIENTS: Record<PrayerTimeKey, [string, string]> = {
  Fajr: ['#7B61FF', '#4D38C2'],
  Sunrise: ['#FFB340', '#FF6B35'],
  Dhuhr: ['#FFD60A', '#FF9500'],
  Asr: ['#FF9500', '#CC6600'],
  Maghrib: ['#FF6B35', '#CC2200'],
  Isha: ['#1B4FB8', '#0A2E6E'],
};

const SILENT_MODE_OPTIONS: SilentModeDuration[] = [
  'off',
  '1h',
  '2h',
  '5h',
  '12h',
  '1d',
  '7d',
];

export default function PrayerNotificationsHub() {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const fontScalePreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);
  const isLangTurkish = i18n.language?.startsWith('tr');
  const uc = useCallback(
    (s: string) => (isLangTurkish ? s.toLocaleUpperCase('tr-TR') : s.toUpperCase()),
    [isLangTurkish],
  );

  const advancedNotifs = useSelector(
    (state: RootState) => state.advancedNotifications,
  );

  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState(true);
  const [showSilentModal, setShowSilentModal] = useState(false);

  const refreshPermission = useCallback(async () => {
    const granted = await prayerNotificationManager.hasPermission();
    setNotificationPermissionGranted(granted);
  }, []);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  useFocusEffect(
    useCallback(() => {
      refreshPermission();
    }, [refreshPermission]),
  );

  const requestPermission = useCallback(async () => {
    const granted = await prayerNotificationManager.requestPermission();
    setNotificationPermissionGranted(granted);
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
    }
    return granted;
  }, [t]);

  const silentModeDuration = advancedNotifs?.silentModeDuration ?? 'off';
  const silentModeStartedAt = advancedNotifs?.silentModeStartedAt ?? null;
  const perPrayer = useMemo(
    () => advancedNotifs?.perPrayer ?? {},
    [advancedNotifs?.perPrayer],
  );

  const isSilentActive = useMemo(
    () =>
      prayerNotificationManager.isSilentModeActive(
        silentModeDuration,
        silentModeStartedAt,
      ),
    [silentModeDuration, silentModeStartedAt],
  );

  const getPrayerActiveCount = useCallback(
    (key: PrayerTimeKey) => {
      const items = perPrayer[key] ?? [];
      return items.filter(i => i.enabled).length;
    },
    [perPrayer],
  );

  const allEnabled = useMemo(
    () => PRAYER_ORDER.every(k => getPrayerActiveCount(k) > 0),
    [getPrayerActiveCount],
  );

  const handleToggleAll = useCallback(async () => {
    const nextValue = !allEnabled;
    if (nextValue && !notificationPermissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    dispatch(toggleAllPrayerNotifications({ enabled: nextValue }));
  }, [allEnabled, notificationPermissionGranted, requestPermission, dispatch]);

  const handlePrayerRowPress = useCallback(
    (prayerKey: PrayerTimeKey) => {
      navigation.navigate(ToolsRoutes.PrayerNotificationDetail, { prayerKey });
    },
    [navigation],
  );

  const handleSilentModeSelect = useCallback(
    (duration: SilentModeDuration) => {
      setShowSilentModal(false);
      dispatch(
        setSilentMode({
          duration,
          startedAt: duration === 'off' ? null : new Date().toISOString(),
        }),
      );
    },
    [dispatch],
  );

  const silentModeLabel = useMemo(() => {
    return t(`notifications.silentMode.${silentModeDuration}`);
  }, [silentModeDuration, t]);

  const styles = useMemo(
    () => createStyles(currentTheme, fontScaleMultiplier),
    [currentTheme, fontScaleMultiplier],
  );

  return (
    <>
      <BottomTabScreenViewContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Chips row: toggle-all + silent mode */}
          <View style={styles.chipsRow}>
            {/* Toggle all chip */}
            <View style={styles.chip}>
              <Icon
                type={Icons.MaterialDesignIcons}
                name={allEnabled ? 'bell-ring-outline' : 'bell-cancel-outline'}
                size={18 * fontScaleMultiplier}
                color={currentTheme.primary}
              />
              <Text style={styles.chipValue}>
                {t('notifications.hub.allNotifs')}
              </Text>
              <Switch
                value={notificationPermissionGranted && allEnabled}
                onValueChange={handleToggleAll}
                trackColor={{
                  false: `${currentTheme.gray}33`,
                  true: currentTheme.primary,
                }}
                thumbColor={currentTheme.white}
                ios_backgroundColor={`${currentTheme.gray}33`}
                style={styles.chipSwitch}
              />
            </View>

            {/* Silent mode chip */}
            <Pressable
              style={styles.chip}
              onPress={() => setShowSilentModal(true)}
            >
              <Icon
                type={Icons.MaterialDesignIcons}
                name={isSilentActive ? 'bell-off-outline' : 'bell-sleep-outline'}
                size={18 * fontScaleMultiplier}
                color={
                  isSilentActive ? currentTheme.systemRed : currentTheme.primary
                }
              />
              <Text
                style={[
                  styles.chipValue,
                  isSilentActive && { color: currentTheme.systemRed },
                ]}
              >
                {t('notifications.hub.chipSilentMode')}
              </Text>
              <Text style={styles.chipLabel}>{silentModeLabel}</Text>
            </Pressable>
          </View>

          {/* Prayer list */}
          <Text style={styles.sectionTitle}>
            {uc(t('notifications.hub.prayersSection'))}
          </Text>
          <View style={styles.card}>
            {PRAYER_ORDER.map((key, index) => {
              const items = perPrayer[key] ?? [];
              const activeItems = items.filter(i => i.enabled);
              const iconInfo = PRAYER_TIME_ICONS[key];
              const gradient = PRAYER_GRADIENTS[key];
              const isLast = index === PRAYER_ORDER.length - 1;
              const hasAnyEnabled = activeItems.length > 0;

              return (
                <Pressable
                  key={key}
                  onPress={() => handlePrayerRowPress(key)}
                  style={({ pressed }) => [
                    styles.prayerRow,
                    !isLast && styles.prayerRowBorder,
                    pressed && styles.prayerRowPressed,
                  ]}
                  android_ripple={{
                    color: `${currentTheme.primary}15`,
                    borderless: false,
                  }}
                >
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.prayerIconBadge}
                  >
                    <Icon
                      type={iconInfo.type}
                      name={iconInfo.name as any}
                      size={20 * fontScaleMultiplier}
                      color="#FFFFFF"
                    />
                  </LinearGradient>

                  <View style={styles.prayerRowContent}>
                    <View style={styles.prayerRowTop}>
                      <Text style={styles.prayerName}>
                        {t(`prayerNames.${key}`)}
                      </Text>
                      {hasAnyEnabled && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>
                            {t('notifications.hub.active')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.prayerRowSummary} numberOfLines={1}>
                      {activeItems.length > 0
                        ? t('notifications.hub.notifCount', {
                            count: activeItems.length,
                          })
                        : t('notifications.hub.noneActive')}
                    </Text>
                  </View>

                  <Icon
                    type={Icons.MaterialDesignIcons}
                    name="chevron-right"
                    size={20 * fontScaleMultiplier}
                    color={currentTheme.placeholderTextColor}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </BottomTabScreenViewContainer>

      {/* Silent mode modal – rendered as RN Modal so it sits above tab bar */}
      <Modal
        visible={showSilentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSilentModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSilentModal(false)}
        >
          <Pressable
            style={[
              styles.silentSheet,
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {t('notifications.hub.silentModeTitle')}
            </Text>
            <Text style={styles.sheetDesc}>
              {t('notifications.hub.silentModeDesc')}
            </Text>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {SILENT_MODE_OPTIONS.map(option => (
                <Pressable
                  key={option}
                  style={[
                    styles.silentOption,
                    silentModeDuration === option &&
                      styles.silentOptionSelected,
                  ]}
                  onPress={() => handleSilentModeSelect(option)}
                  android_ripple={{
                    color: `${currentTheme.primary}22`,
                    borderless: false,
                  }}
                >
                  <Text
                    style={[
                      styles.silentOptionText,
                      silentModeDuration === option &&
                        styles.silentOptionTextSelected,
                    ]}
                  >
                    {t(`notifications.silentMode.${option}`)}
                  </Text>
                  {silentModeDuration === option && (
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="check"
                      size={18 * fontScaleMultiplier}
                      color={currentTheme.primary}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (theme: any, fsm: number) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 8,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    chip: {
      flex: 1,
      backgroundColor: theme.cardViewBackgroundColor,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    chipSwitch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
      marginTop: 2,
      alignSelf: 'center',
    },
    chipValue: {
      fontSize: 13 * fsm,
      fontWeight: '600',
      color: theme.textColor,
      textAlign: 'center',
    },
    chipLabel: {
      fontSize: 11 * fsm,
      color: theme.placeholderTextColor,
      textAlign: 'center',
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
    sectionTitle: {
      fontSize: 13 * fsm,
      fontWeight: '600',
      color: theme.placeholderTextColor,
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    prayerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    prayerRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.gray + '40',
    },
    prayerRowPressed: {
      opacity: 0.7,
    },
    prayerIconBadge: {
      width: 40 * fsm,
      height: 40 * fsm,
      borderRadius: 10 * fsm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    prayerRowContent: {
      flex: 1,
    },
    prayerRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    prayerName: {
      fontSize: 15 * fsm,
      fontWeight: '600',
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
    prayerRowSummary: {
      fontSize: 12 * fsm,
      color: theme.placeholderTextColor,
      marginTop: 2,
    },
    // Silent mode modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    silentSheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 48,
      maxHeight: '80%',
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
      fontSize: 17 * fsm,
      fontWeight: '700',
      color: theme.textColor,
      marginBottom: 6,
    },
    sheetDesc: {
      fontSize: 13 * fsm,
      color: theme.placeholderTextColor,
      marginBottom: 14,
      lineHeight: 18 * fsm,
    },
    silentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 4,
    },
    silentOptionSelected: {
      backgroundColor: theme.primary + '18',
    },
    silentOptionText: {
      fontSize: 15 * fsm,
      color: theme.textColor,
    },
    silentOptionTextSelected: {
      color: theme.primary,
      fontWeight: '600',
    },
  });
