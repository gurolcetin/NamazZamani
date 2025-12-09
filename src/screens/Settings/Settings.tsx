import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
  Switch,
  DevSettings,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  BottomTabScreenViewContainer,
  FormSegmentedControl,
  Icon,
  Icons,
} from '../../../libs/components';
import {
  AsyncStorageConstants,
  LanguagePrefix,
  LanguageSettingsConstants,
  SettingsConstants,
  SettingsScreenLanguageConstants,
  ThemeSettingsConstants,
  FontSizeSettingsConstants,
} from '../../../libs/common/constants';
import { Accent, Theme, FontScaleOption } from '../../../libs/common/enums';
import { useTheme } from '../../../libs/core/providers';
import {
  setPrayerNotificationPreference,
  setShowRamadanCountdownCard,
  setFontScalePreference,
} from '../../../libs/redux/reducers/ApplicationSettings';
import { createStyles } from './style';
import { PrayerTimeKey } from '../../../libs/common/types';
import { prayerNotificationManager } from '../../../libs/core/helpers/prayer-notification';
import { getFontScaleMultiplier } from '../../../libs/core/helpers';

const accentOptions: Accent[] = [
  Accent.TEAL,
  Accent.PURPLE,
  Accent.EMERALD,
  Accent.BLUE,
  Accent.ORANGE,
];

const accentColorMap: Record<Accent, string> = {
  [Accent.TEAL]: '#14B8A6',
  [Accent.PURPLE]: '#8B5CF6',
  [Accent.EMERALD]: '#10B981',
  [Accent.BLUE]: '#3B82F6',
  [Accent.ORANGE]: '#F97316',
};

type MaterialDesignIconsThemeName =
  | 'weather-sunny'
  | 'moon-waning-crescent'
  | 'cellphone-cog';

const themeModeIcons: Record<Theme, MaterialDesignIconsThemeName> = {
  [Theme.LIGHT]: 'weather-sunny',
  [Theme.DARK]: 'moon-waning-crescent',
  [Theme.SYSTEM]: 'cellphone-cog',
};

const PRAYER_NOTIFICATION_ORDER: PrayerTimeKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

type NotificationToggleItem = {
  key: PrayerTimeKey;
  label: string;
  enabled: boolean;
};

const normalizeLanguageKey = (value?: string | null) =>
  (value ?? LanguagePrefix.TURKISH).slice(0, 2);

type SettingsProps = {
  navigation?: {
    canGoBack?: () => boolean;
    goBack: () => void;
  };
};

const Settings = ({}: SettingsProps) => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { currentTheme, toggleTheme, accent, setAccent } = useTheme();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const applicationSettings = useSelector(
    (state: any) => state.applicationSettings,
  );

  const [selectedLanguage, setSelectedLanguage] = useState(
    LanguagePrefix.TURKISH,
  );
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langButtonLayout, setLangButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [themeSelection, setThemeSelection] = useState<Theme>(Theme.SYSTEM);
  const fontScalePreference =
    applicationSettings?.fontScale ?? FontScaleOption.MEDIUM;
  const fontScaleMultiplier = useMemo(
    () => getFontScaleMultiplier(fontScalePreference),
    [fontScalePreference],
  );
  const showRamadanCountdownCard =
    applicationSettings?.showRamadanCountdownCard ?? true;
  const prayerNotificationPreferences =
    applicationSettings?.prayerNotificationPreferences;
  const [isNotificationCardOpen, setIsNotificationCardOpen] =
    useState<boolean>(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState<boolean>(true);

  const styles = useMemo(
    () => createStyles(currentTheme, fontScaleMultiplier),
    [currentTheme, fontScaleMultiplier],
  );
  const mailErrorTitle = t('settings.mailErrorTitle');
  const mailErrorMessage = t('settings.mailErrorMessage');

  // Dil butonuna ref
  const langButtonRef = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem(AsyncStorageConstants.LanguageKey)
      .then(language => {
        setSelectedLanguage(normalizeLanguageKey(language));
      })
      .catch(() => {
        setSelectedLanguage(LanguagePrefix.TURKISH);
      });
  }, []);

  useEffect(() => {
    if (i18n.language) {
      setSelectedLanguage(normalizeLanguageKey(i18n.language));
    }
  }, [i18n.language]);

  useEffect(() => {
    setThemeSelection(applicationTheme?.preference ?? Theme.SYSTEM);
  }, [applicationTheme?.preference]);

  const languageOptions = [
    {
      key: LanguagePrefix.TURKISH,
      title: t(LanguageSettingsConstants.Turkish.key),
      flag: require('../../../assets/images/flags/turkey.png'),
    },
    {
      key: LanguagePrefix.ENGLISH,
      title: t(LanguageSettingsConstants.English.key),
      flag: require('../../../assets/images/flags/united-kingdom.png'),
    },
  ];

  const selectedLanguageOption =
    languageOptions.find(option => option.key === selectedLanguage) ||
    languageOptions[0];

  const notificationItems = useMemo<NotificationToggleItem[]>(
    () =>
      PRAYER_NOTIFICATION_ORDER.map(key => ({
        key,
        label: t(`prayerNames.${key}`),
        enabled: prayerNotificationPreferences?.[key] !== false,
      })),
    [prayerNotificationPreferences, t],
  );

  const notificationRows = useMemo(
    () =>
      notificationItems.reduce<
        Array<{ left: NotificationToggleItem; right?: NotificationToggleItem }>
      >((rows, _, index) => {
        if (index % 2 === 0) {
          rows.push({
            left: notificationItems[index],
            right: notificationItems[index + 1],
          });
        }
        return rows;
      }, []),
    [notificationItems],
  );

  const fontSizeOptions = useMemo(
    () => [
      {
        label: t(FontSizeSettingsConstants.Small.key),
        value: FontScaleOption.SMALL,
      },
      {
        label: t(FontSizeSettingsConstants.Medium.key),
        value: FontScaleOption.MEDIUM,
      },
      {
        label: t(FontSizeSettingsConstants.Large.key),
        value: FontScaleOption.LARGE,
      },
      {
        label: t(FontSizeSettingsConstants.ExtraLarge.key),
        value: FontScaleOption.EXTRA_LARGE,
      },
    ],
    [t],
  );

  const defaultIconSize = 20 * fontScaleMultiplier;
  const smallIconSize = 18 * fontScaleMultiplier;
  const largeIconSize = 22 * fontScaleMultiplier;

  const areAllNotificationsEnabled = useMemo(
    () =>
      notificationPermissionGranted &&
      notificationItems.every(item => item.enabled),
    [notificationItems, notificationPermissionGranted],
  );

  const versionLabel = useMemo(() => {
    const version = DeviceInfo.getVersion();
    return version;
  }, []);

  const refreshNotificationPermissionStatus = useCallback(async () => {
    const granted = await prayerNotificationManager.hasPermission();
    setNotificationPermissionGranted(granted);
    return granted;
  }, []);

  useEffect(() => {
    refreshNotificationPermissionStatus();
  }, [refreshNotificationPermissionStatus]);

  useFocusEffect(
    useCallback(() => {
      refreshNotificationPermissionStatus();
    }, [refreshNotificationPermissionStatus]),
  );

  const requestNotificationPermission = useCallback(async () => {
    const granted = await prayerNotificationManager.requestPermission();
    setNotificationPermissionGranted(granted);
    if (!granted) {
      Alert.alert(
        t('notifications.permissionDeniedTitle'),
        t('notifications.permissionDeniedMessage'),
        [
          {
            text: t('notifications.goToSettingsButton'),
            onPress: () => {
              Linking.openSettings().catch(() => {});
            },
          },
          {
            text: t('notifications.cancelButton'),
            style: 'cancel',
          },
        ],
      );
    }
    return granted;
  }, [t]);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setIsLangOpen(false);
      if (lang === selectedLanguage) {
        return;
      }
      i18n.changeLanguage(lang);
      setSelectedLanguage(lang);
    },
    [i18n, selectedLanguage],
  );

  const openLanguageDropdown = useCallback(() => {
    if (langButtonRef.current) {
      langButtonRef.current.measureInWindow(
        (x: any, y: any, width: any, height: any) => {
          setLangButtonLayout({ x, y, width, height });
          setIsLangOpen(true);
        },
      );
    } else {
      setIsLangOpen(true);
    }
  }, []);

  const handleLanguageButtonPress = useCallback(() => {
    if (isLangOpen) {
      setIsLangOpen(false);
    } else {
      openLanguageDropdown();
    }
  }, [isLangOpen, openLanguageDropdown]);

  const handleThemeChange = useCallback(
    (mode: Theme) => {
      setThemeSelection(mode);
      toggleTheme(mode);
    },
    [toggleTheme],
  );

  const handleAccentPress = useCallback(
    (value: Accent) => {
      setAccent(value);
    },
    [setAccent],
  );

  const handleFontScaleChange = useCallback(
    (scale: FontScaleOption) => {
      dispatch(setFontScalePreference(scale));
    },
    [dispatch],
  );

  const handleRamadanCountdownToggle = useCallback(
    (value: boolean) => {
      dispatch(setShowRamadanCountdownCard(value));
    },
    [dispatch],
  );

  const applyNotificationPreference = useCallback(
    (key: PrayerTimeKey, enabled: boolean) => {
      dispatch(setPrayerNotificationPreference({ key, enabled }));
    },
    [dispatch],
  );

  const handleNotificationToggle = useCallback(
    async (key: PrayerTimeKey, enabled: boolean) => {
      if (enabled) {
        let granted = notificationPermissionGranted;
        if (granted) {
          granted = await refreshNotificationPermissionStatus();
        }
        if (!granted) {
          granted = await requestNotificationPermission();
        }
        if (!granted) {
          return;
        }
      }
      applyNotificationPreference(key, enabled);
    },
    [
      notificationPermissionGranted,
      refreshNotificationPermissionStatus,
      requestNotificationPermission,
      applyNotificationPreference,
    ],
  );

  const handleToggleAllNotifications = useCallback(async () => {
    const nextValue = !areAllNotificationsEnabled;
    if (nextValue) {
      let granted = notificationPermissionGranted;
      if (granted) {
        granted = await refreshNotificationPermissionStatus();
      }
      if (!granted) {
        granted = await requestNotificationPermission();
      }
      if (!granted) {
        return;
      }
    }
    PRAYER_NOTIFICATION_ORDER.forEach(prayerKey => {
      applyNotificationPreference(prayerKey, nextValue);
    });
  }, [
    areAllNotificationsEnabled,
    notificationPermissionGranted,
    refreshNotificationPermissionStatus,
    requestNotificationPermission,
    applyNotificationPreference,
  ]);

  const handleClearStorage = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      DevSettings.reload();
    } catch (error) {
      console.warn('AsyncStorage clear error:', error);
    }
  }, []);

  const handleSendFeedback = useCallback(() => {
    const subjectText = t(
      SettingsScreenLanguageConstants.FeedbackEmailSubject.key,
    );
    const bodyLine = t(SettingsScreenLanguageConstants.FeedbackEmailBody.key);
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(`${bodyLine}\n\n`);
    const url = `mailto:gurolmehmetcetin@gmail.com?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(mailErrorTitle, mailErrorMessage);
    });
  }, [mailErrorMessage, mailErrorTitle, t]);

  const closeDropdown = useCallback(() => {
    setIsLangOpen(false);
  }, []);

  return (
    <>
      <BottomTabScreenViewContainer>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Dil kartı */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t(SettingsScreenLanguageConstants.Language.key)}
              </Text>
              <Pressable
                ref={langButtonRef}
                style={[
                  styles.languageButton,
                  {
                    backgroundColor: `${currentTheme.primary}15`,
                    borderWidth: 1,
                    borderColor: `${currentTheme.gray}22`,
                  },
                ]}
                onPress={handleLanguageButtonPress}
                android_ripple={{ color: currentTheme.gray, borderless: false }}
              >
                <View style={styles.languageInfo}>
                  <Image
                    source={selectedLanguageOption.flag}
                    style={styles.flag}
                  />
                  <Text
                    style={[
                      styles.languageText,
                      { color: currentTheme.textColor },
                    ]}
                  >
                    {selectedLanguageOption.title}
                  </Text>
                </View>
                <Icon
                  type={Icons.MaterialDesignIcons}
                  name={isLangOpen ? 'chevron-up' : 'chevron-down'}
                  size={defaultIconSize}
                  color={currentTheme.textColor}
                />
              </Pressable>
            </View>

            {/* Bildirim kartı */}
            <View style={styles.card}>
              <Pressable
                onPress={() => setIsNotificationCardOpen(prev => !prev)}
                style={styles.notificationHeader}
                android_ripple={{ color: currentTheme.gray, borderless: false }}
              >
                <View style={styles.notificationHeaderLeft}>
                  <View style={styles.notificationIconWrap}>
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="bell-outline"
                      size={defaultIconSize}
                      color={currentTheme.textColor}
                    />
                  </View>
                  <View style={styles.notificationHeaderTexts}>
                    <Text style={styles.notificationHeaderTitle}>
                      {t(
                        SettingsScreenLanguageConstants
                          .NotificationSettingsTitle.key,
                      )}
                    </Text>
                    <Text style={styles.notificationSubtitle}>
                      {t(
                        SettingsScreenLanguageConstants
                          .NotificationSettingsSubtitle.key,
                      )}
                    </Text>
                  </View>
                </View>
                <View style={styles.notificationHeaderRight}>
                  <Pressable
                    onPress={event => {
                      event.stopPropagation();
                      handleToggleAllNotifications();
                    }}
                    style={styles.notificationChip}
                    android_ripple={{
                      color: `${currentTheme.primary}22`,
                      borderless: false,
                    }}
                  >
                    <Text style={styles.notificationChipText}>
                      {t(
                        areAllNotificationsEnabled
                          ? 'common.turnOffAll'
                          : 'common.turnOnAll',
                      )}
                    </Text>
                  </Pressable>
                  <Icon
                    type={Icons.MaterialDesignIcons}
                    name={
                      isNotificationCardOpen ? 'chevron-up' : 'chevron-down'
                    }
                    size={defaultIconSize}
                    color={currentTheme.textColor}
                  />
                </View>
              </Pressable>
              {isNotificationCardOpen && (
                <View style={styles.notificationGrid}>
                  {notificationRows.map(row => (
                    <View style={styles.notificationRow} key={row.left.key}>
                      {[row.left, row.right].map((item, idx) =>
                        item ? (
                          <View key={item.key} style={styles.notificationCell}>
                            <Text style={styles.notificationLabel}>
                              {item.label}
                            </Text>
                            <Switch
                              value={
                                notificationPermissionGranted
                                  ? item.enabled
                                  : false
                              }
                              onValueChange={value =>
                                handleNotificationToggle(item.key, value)
                              }
                              trackColor={{
                                false: `${currentTheme.gray}33`,
                                true: currentTheme.primary,
                              }}
                              thumbColor={
                                item.enabled
                                  ? currentTheme.white
                                  : currentTheme.cardViewBackgroundColor
                              }
                              ios_backgroundColor={`${currentTheme.gray}33`}
                            />
                          </View>
                        ) : (
                          <View
                            key={`placeholder-${row.left.key}-${idx}`}
                            style={[
                              styles.notificationCell,
                              styles.notificationCellPlaceholder,
                            ]}
                          />
                        ),
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Tema + Accent */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t(SettingsScreenLanguageConstants.ThemeAndAccent.key)}
              </Text>
              <Text style={styles.themeSectionLabel}>
                {t(SettingsScreenLanguageConstants.ThemeMode.key)}
              </Text>
              <FormSegmentedControl
                options={[
                  {
                    label: t(ThemeSettingsConstants.Light.key),
                    value: Theme.LIGHT,
                    iconProps: {
                      name: themeModeIcons.light,
                      type: Icons.MaterialDesignIcons,
                      size: smallIconSize,
                    },
                  },
                  {
                    label: t(ThemeSettingsConstants.Dark.key),
                    value: Theme.DARK,
                    iconProps: {
                      name: themeModeIcons.dark,
                      type: Icons.MaterialDesignIcons,
                      size: smallIconSize,
                    },
                  },
                  {
                    label: t(ThemeSettingsConstants.SystemDefault.key),
                    value: Theme.SYSTEM,
                    iconProps: {
                      name: themeModeIcons.system,
                      type: Icons.MaterialDesignIcons,
                      size: smallIconSize,
                    },
                  },
                ]}
                value={themeSelection}
                onChange={(theme: any) => {
                  handleThemeChange(theme);
                }}
              />
              <Text
                style={[
                  styles.themeSectionLabel,
                  {
                    marginTop: 18,
                  },
                ]}
              >
                {t(SettingsScreenLanguageConstants.AccentColor.key)}
              </Text>
              <View style={styles.accentRow}>
                {accentOptions.map(opt => {
                  const color = accentColorMap[opt];
                  const isActive = accent === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => handleAccentPress(opt)}
                      android_ripple={{
                        color: currentTheme.gray,
                        borderless: false,
                      }}
                      style={[
                        styles.accentSwatchWrapper,
                        {
                          backgroundColor: isActive
                            ? `${color}22`
                            : currentTheme.inputBackgroundColor,
                          borderWidth: isActive ? 2 : 0,
                          borderColor: isActive ? color : 'transparent',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.accentSwatch,
                          {
                            backgroundColor: color,
                          },
                        ]}
                      >
                        {isActive && (
                          <Icon
                            type={Icons.MaterialDesignIcons}
                            name="check"
                            size={smallIconSize}
                            color={currentTheme.white}
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Uygulama Ayarları */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t(SettingsConstants.CalculateSettings.key)}
              </Text>
              <Text style={styles.themeSectionLabel}>
                {t(SettingsScreenLanguageConstants.FontSize.key)}
              </Text>
              <View style={{ marginBottom: 16 }}>
                <FormSegmentedControl
                  options={fontSizeOptions}
                  value={fontScalePreference}
                  fontScaleMultiplier={fontScaleMultiplier}
                  onChange={(value: string) =>
                    handleFontScaleChange(value as FontScaleOption)
                  }
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>
                  {t(
                    SettingsScreenLanguageConstants.RamadanCountdownToggleLabel
                      .key,
                  )}
                </Text>
                <Switch
                  value={showRamadanCountdownCard}
                  onValueChange={handleRamadanCountdownToggle}
                  trackColor={{
                    false: `${currentTheme.gray}`,
                    true: currentTheme.primary,
                  }}
                  thumbColor={
                    showRamadanCountdownCard
                      ? currentTheme.white
                      : currentTheme.cardViewBackgroundColor
                  }
                  ios_backgroundColor={`${currentTheme.gray}33`}
                />
              </View>
              <Text style={styles.toggleHint}>
                {t(
                  SettingsScreenLanguageConstants.RamadanCountdownToggleHint
                    .key,
                )}
              </Text>
            </View>

            {/* Gelişmiş */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t(SettingsScreenLanguageConstants.AdvancedTitle.key)}
              </Text>
              <Text
                style={[
                  styles.helperText,
                  { color: currentTheme.gray, marginBottom: 12 },
                ]}
              >
                {t(SettingsScreenLanguageConstants.AdvancedDescription.key)}
              </Text>
              <Pressable
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: currentTheme.systemRed || '#EF4444',
                    shadowColor: currentTheme.systemRed || '#EF4444',
                  },
                ]}
                onPress={handleClearStorage}
                android_ripple={{
                  color: currentTheme.gray,
                  borderless: false,
                }}
              >
                <Text style={styles.saveButtonLabel}>
                  {t(SettingsScreenLanguageConstants.AdvancedClearButton.key)}
                </Text>
              </Pressable>
            </View>

            {/* Geri Bildirim */}
            <View style={styles.card}>
              <Pressable
                onPress={handleSendFeedback}
                android_ripple={{ color: currentTheme.gray, borderless: false }}
                style={{
                  backgroundColor: currentTheme.inputBackgroundColor,
                  borderRadius: 24,
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: currentTheme.textColor,
                      fontSize: 16 * fontScaleMultiplier,
                      fontWeight: '600',
                    }}
                  >
                    {t(SettingsScreenLanguageConstants.FeedbackTitle.key)}
                  </Text>
                  <Text
                    style={{
                      color: currentTheme.gray,
                      fontSize: 13 * fontScaleMultiplier,
                      marginTop: 6,
                    }}
                  >
                    {t(SettingsScreenLanguageConstants.FeedbackSubtitle.key)}
                  </Text>
                </View>
                <Icon
                  type={Icons.MaterialDesignIcons}
                  name="chevron-right"
                  size={largeIconSize}
                  color={currentTheme.gray}
                />
              </Pressable>
            </View>

            <View style={styles.versionInfoContainer}>
              <Text style={styles.versionInfoLabel}>
                {t(SettingsScreenLanguageConstants.AppVersionLabel.key)}
              </Text>
              <Text style={styles.versionInfoValue}>{versionLabel}</Text>
            </View>
          </ScrollView>
        </View>
      </BottomTabScreenViewContainer>

      {/* Dropdown'u tüm ekranın üstünde gösteren Modal */}
      {isLangOpen && langButtonLayout && (
        <Modal
          transparent
          visible={isLangOpen}
          animationType="fade"
          onRequestClose={closeDropdown}
        >
          <TouchableWithoutFeedback onPress={closeDropdown}>
            <View style={dropdownStyles.modalBackdrop}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View
                  style={[
                    dropdownStyles.globalLangDropdown,
                    {
                      backgroundColor: currentTheme.cardViewBackgroundColor,
                      borderColor: currentTheme.gray,
                      top: langButtonLayout.y + langButtonLayout.height + 6,
                      left: langButtonLayout.x,
                      width: langButtonLayout.width,
                    },
                  ]}
                >
                  <ScrollView
                    style={dropdownStyles.langDropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    {languageOptions.map(option => {
                      const active = option.key === selectedLanguage;
                      return (
                        <Pressable
                          key={option.key}
                          style={[
                            dropdownStyles.langOptionRow,
                            {
                              backgroundColor: active
                                ? `${currentTheme.gray}33`
                                : 'transparent',
                            },
                          ]}
                          onPress={() => handleLanguageChange(option.key)}
                        >
                          <View style={dropdownStyles.langOptionLeft}>
                            <Image
                              source={option.flag}
                              style={dropdownStyles.langFlag}
                            />
                            <Text
                              style={{
                                fontSize: 14 * fontScaleMultiplier,
                                color: currentTheme.textColor,
                              }}
                            >
                              {option.title}
                            </Text>
                          </View>
                          {active && (
                            <Icon
                              type={Icons.MaterialDesignIcons}
                              name="check"
                              size={smallIconSize}
                              color={currentTheme.primary}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
};

export default Settings;

const dropdownStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  globalLangDropdown: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  langDropdownScroll: {
    maxHeight: 220,
  },
  langOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  langFlag: {
    width: 25,
    height: 25,
    borderRadius: 3,
    marginRight: 8,
    resizeMode: 'contain',
  },
});
