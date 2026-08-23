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
  Text,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  BottomTabScreenViewContainer,
  FormSegmentedControl,
  Icon,
  Icons,
  ScrollAwareView,
} from '../../../libs/components';
import {
  AsyncStorageConstants,
  GeneralLanguageConstants,
  LanguagePrefix,
  LanguageSettingsConstants,
  SettingsConstants,
  SettingsScreenLanguageConstants,
  ThemeSettingsConstants,
  FontSizeSettingsConstants,
  IS_DEV_FEATURES_ENABLED,
  IS_ADS_ENABLED,
} from '../../../libs/common/constants';
import { AdsConsent } from 'react-native-google-mobile-ads';
import { Accent, Theme, FontScaleOption } from '../../../libs/common/enums';
import { useTheme } from '../../../libs/core/providers';
import {
  setShowRamadanCountdownCard,
  setFontScalePreference,
  setShowReligiousDaysSlider,
  setShowAsmaulHusnaCard,
  setShowHadithCard,
  setShowQuranAyahCard,
} from '../../../libs/redux/reducers/ApplicationSettings';
import { createStyles } from './style';
import { getFontScaleMultiplier, isPrivacyOptionsRequired } from '../../../libs/core/helpers';

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


const normalizeLanguageKey = (value?: string | null) =>
  (value ?? LanguagePrefix.TURKISH).slice(0, 2);

type SettingsProps = {
  navigation?: {
    canGoBack?: () => boolean;
    goBack: () => void;
  };
};

const showActionMap = {
  showRamadanCountdownCard: setShowRamadanCountdownCard,
  showReligiousDaysSlider: setShowReligiousDaysSlider,
  showAsmaulHusnaCard: setShowAsmaulHusnaCard,
  showHadithCard: setShowHadithCard,
  showQuranAyahCard: setShowQuranAyahCard,
} as const;

type ToggleableShowKey = keyof typeof showActionMap;

type ApplicationToggleItem = {
  key: ToggleableShowKey;
  label: string;
  value: boolean;
  hint?: string;
};

type DebugStorageEntry = {
  key: string;
  value: string;
  summaryLines: string[];
};

const DEV_STORAGE_PREFIXES = [
  'prayerTimes:month:v1',
  'prayerNotifications:scheduledIds:v1',
];

const MONTH_CACHE_PREFIX = 'prayerTimes:month:v1:';

const formatDebugEntry = (key: string, value: string | null): DebugStorageEntry => {
  const rawValue = value ?? '(null)';
  const summaryLines: string[] = [];

  if (key.startsWith(MONTH_CACHE_PREFIX)) {
    try {
      const parsed = JSON.parse(rawValue) as {
        fetchedAt?: string;
        cacheLabel?: string;
        data?: unknown[];
      };
      const rawCacheKey = key.slice(MONTH_CACHE_PREFIX.length);
      const keyParts = rawCacheKey.split('@');
      const coordsPart = keyParts[1] ?? '';
      const methodPart = keyParts[2] ?? '';
      const tzPart = keyParts.slice(3).join('@');
      summaryLines.push(`Label: ${parsed.cacheLabel ?? '(no label)'}`);
      summaryLines.push(`FetchedAt: ${parsed.fetchedAt ?? '(unknown)'}`);
      summaryLines.push(
        `Days: ${Array.isArray(parsed.data) ? parsed.data.length : 0}`,
      );
      if (coordsPart) summaryLines.push(`Coords: ${coordsPart}`);
      if (methodPart) summaryLines.push(`Method: ${methodPart}`);
      if (tzPart) summaryLines.push(`TZ: ${tzPart}`);
    } catch {
      summaryLines.push('Month cache parse failed');
    }
  } else if (key.startsWith('prayerNotifications:scheduledIds:v1')) {
    try {
      const ids = JSON.parse(rawValue) as string[];
      summaryLines.push(
        `Scheduled IDs: ${Array.isArray(ids) ? ids.length : 0}`,
      );
    } catch {
      summaryLines.push('Notification cache parse failed');
    }
  }

  return {
    key,
    value: rawValue,
    summaryLines,
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
  const showReligiousDaysSlider =
    applicationSettings?.showReligiousDaysSlider ?? true;
  const showAsmaulHusnaCard =
    applicationSettings?.showAsmaulHusnaCard ?? true;
  const showHadithCard = applicationSettings?.showHadithCard ?? true;
  const showQuranAyahCard =
    applicationSettings?.showQuranAyahCard ?? true;
  const [isApplicationSettingsOpen, setIsApplicationSettingsOpen] =
    useState<boolean>(false);
  const [debugStorageEntries, setDebugStorageEntries] = useState<
    DebugStorageEntry[]
  >([]);
  const [isLoadingDebugStorage, setIsLoadingDebugStorage] =
    useState<boolean>(false);

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

  const versionLabel = useMemo(() => {
    const version = DeviceInfo.getVersion();
    return version;
  }, []);

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

  const handleShowToggle = useCallback(
    (key: ToggleableShowKey) => (value: boolean) => {
      dispatch(showActionMap[key](value));
    },
    [dispatch],
  );

  const applicationToggleItems = useMemo<ApplicationToggleItem[]>(
    () => [
      {
        key: 'showRamadanCountdownCard',
        label: t(
          SettingsScreenLanguageConstants.RamadanCountdownToggleLabel.key,
        ),
        value: showRamadanCountdownCard,
        hint: t(
          SettingsScreenLanguageConstants.RamadanCountdownToggleHint.key,
        ),
      },
      {
        key: 'showReligiousDaysSlider',
        label: t(
          SettingsScreenLanguageConstants.ReligiousDaysSliderToggleLabel.key,
        ),
        value: showReligiousDaysSlider,
      },
      {
        key: 'showAsmaulHusnaCard',
        label: t(
          SettingsScreenLanguageConstants.AsmaulHusnaToggleLabel.key,
        ),
        value: showAsmaulHusnaCard,
      },
      {
        key: 'showHadithCard',
        label: t(SettingsScreenLanguageConstants.HadithToggleLabel.key),
        value: showHadithCard,
      },
      {
        key: 'showQuranAyahCard',
        label: t(SettingsScreenLanguageConstants.QuranAyahToggleLabel.key),
        value: showQuranAyahCard,
      },
    ],
    [
      showRamadanCountdownCard,
      showReligiousDaysSlider,
      showAsmaulHusnaCard,
      showHadithCard,
      showQuranAyahCard,
      t,
    ],
  );

  const handleClearStorage = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert(
        t(SettingsScreenLanguageConstants.RestartRequiredTitle.key),
        t(SettingsScreenLanguageConstants.RestartRequiredMessage.key),
        [{ text: t(GeneralLanguageConstants.Ok.key) }],
      );
    } catch (error) {
      console.warn('AsyncStorage clear error:', error);
    }
  }, [t]);

  const handleManagePrivacy = useCallback(async () => {
    try {
      await AdsConsent.showPrivacyOptionsForm();
    } catch (error) {
      console.warn('Privacy options form failed:', error);
    }
  }, []);

  const handleSendFeedback = useCallback(() => {
    const subjectText = t(
      SettingsScreenLanguageConstants.FeedbackEmailSubject.key,
    );
    const bodyLine = t(SettingsScreenLanguageConstants.FeedbackEmailBody.key);
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(`${bodyLine}\n\n`);
    const url = `mailto:gmsactech@gmail.com?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(mailErrorTitle, mailErrorMessage);
    });
  }, [mailErrorMessage, mailErrorTitle, t]);

  const closeDropdown = useCallback(() => {
    setIsLangOpen(false);
  }, []);

  const handleLoadDebugStorage = useCallback(async () => {
    if (!IS_DEV_FEATURES_ENABLED) {
      return;
    }
    try {
      setIsLoadingDebugStorage(true);
      const allKeys = await AsyncStorage.getAllKeys();
      const keys = allKeys
        .filter(key => DEV_STORAGE_PREFIXES.some(prefix => key.startsWith(prefix)))
        .sort((a, b) => a.localeCompare(b));
      if (!keys.length) {
        setDebugStorageEntries([]);
        return;
      }
      const keyValuePairs = await AsyncStorage.multiGet(keys);
      const entries = keyValuePairs.map(([key, value]) =>
        formatDebugEntry(key, value),
      );
      setDebugStorageEntries(entries);
    } catch (error) {
      console.warn('Debug storage load error:', error);
      setDebugStorageEntries([]);
    } finally {
      setIsLoadingDebugStorage(false);
    }
  }, []);

  return (
    <>
      <BottomTabScreenViewContainer>
        <View style={{ flex: 1 }}>
          <ScrollAwareView
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
              <Pressable
                onPress={() =>
                  setIsApplicationSettingsOpen(prevState => !prevState)
                }
                style={styles.notificationHeader}
                android_ripple={{ color: currentTheme.gray, borderless: false }}
              >
                <View style={styles.notificationHeaderLeft}>
                  <View style={styles.notificationIconWrap}>
                    <Icon
                      type={Icons.MaterialDesignIcons}
                      name="tune-variant"
                      size={defaultIconSize}
                      color={currentTheme.textColor}
                    />
                  </View>
                  <View style={styles.notificationHeaderTexts}>
                    <Text style={styles.notificationHeaderTitle}>
                      {t(SettingsConstants.CalculateSettings.key)}
                    </Text>
                    <Text style={styles.notificationSubtitle}>
                      {t("settings.applicationSettingsDescription")}
                    </Text>
                  </View>
                </View>
                <Icon
                  type={Icons.MaterialDesignIcons}
                  name={
                    isApplicationSettingsOpen ? 'chevron-up' : 'chevron-down'
                  }
                  size={defaultIconSize}
                  color={currentTheme.textColor}
                />
              </Pressable>
              {isApplicationSettingsOpen && (
                <View style={styles.collapsibleContent}>
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
                  {applicationToggleItems.map(item => (
                    <View key={item.key}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>{item.label}</Text>
                        <Switch
                          value={item.value}
                          onValueChange={handleShowToggle(item.key)}
                          trackColor={{
                            false: `${currentTheme.gray}`,
                            true: currentTheme.primary,
                          }}
                          thumbColor={
                            item.value
                              ? currentTheme.white
                              : currentTheme.cardViewBackgroundColor
                          }
                          ios_backgroundColor={`${currentTheme.gray}33`}
                        />
                      </View>
                      {item.hint ? (
                        <Text style={styles.toggleHint}>{item.hint}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
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

              {IS_DEV_FEATURES_ENABLED && (
                <View style={styles.debugContainer}>
                  <Pressable
                    style={[
                      styles.debugButton,
                      {
                        backgroundColor: `${currentTheme.primary}18`,
                        borderColor: `${currentTheme.primary}44`,
                      },
                    ]}
                    onPress={handleLoadDebugStorage}
                    android_ripple={{
                      color: `${currentTheme.primary}22`,
                      borderless: false,
                    }}
                  >
                    <Text style={styles.debugButtonLabel}>
                      {isLoadingDebugStorage
                        ? 'Loading cache...'
                        : 'Dev: Prayer Cache List'}
                    </Text>
                  </Pressable>
                  <Text style={styles.debugHint}>
                    Filtre: prayerTimes:month:v1, prayerNotifications:scheduledIds:v1
                  </Text>
                  {debugStorageEntries.map(entry => (
                    <View key={entry.key} style={styles.debugItem}>
                      <Text style={styles.debugKey}>{entry.key}</Text>
                      {entry.summaryLines.map(line => (
                        <Text key={`${entry.key}-${line}`} style={styles.debugMeta}>
                          {line}
                        </Text>
                      ))}
                      <Text style={styles.debugValue}>{entry.value}</Text>
                    </View>
                  ))}
                  {!isLoadingDebugStorage && debugStorageEntries.length === 0 && (
                    <Text style={styles.debugEmpty}>No matching cache key.</Text>
                  )}
                </View>
              )}
            </View>

            {/* Gizlilik Tercihleri */}
            {IS_ADS_ENABLED && isPrivacyOptionsRequired() && (
              <View style={styles.card}>
                <Pressable
                  onPress={handleManagePrivacy}
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
                      {t(SettingsScreenLanguageConstants.PrivacyPreferencesTitle.key)}
                    </Text>
                    <Text
                      style={{
                        color: currentTheme.gray,
                        fontSize: 13 * fontScaleMultiplier,
                        marginTop: 6,
                      }}
                    >
                      {t(SettingsScreenLanguageConstants.PrivacyPreferencesSubtitle.key)}
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
            )}

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
          </ScrollAwareView>
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
                  <ScrollAwareView
                    disableReachBottomTracking
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
                  </ScrollAwareView>
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
