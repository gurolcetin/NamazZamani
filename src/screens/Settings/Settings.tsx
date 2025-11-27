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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  FormSegmentedControl,
  Icon,
  Icons,
  ScreenViewContainer,
} from '../../../libs/components';
import {
  AsyncStorageConstants,
  LanguagePrefix,
  LanguageSettingsConstants,
  SettingsConstants,
  SettingsScreenLanguageConstants,
  ThemeSettingsConstants,
} from '../../../libs/common/constants';
import { Accent, Theme } from '../../../libs/common/enums';
import { useTheme } from '../../../libs/core/providers';
import { updateApplicationTheme } from '../../../libs/redux/reducers/ApplicationTheme';
import { setShowRamadanCountdownCard } from '../../../libs/redux/reducers/ApplicationSettings';
import { createStyles } from './style';
import { DevSettings } from 'react-native';

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
  const showRamadanCountdownCard =
    applicationSettings?.showRamadanCountdownCard ?? true;

  const styles = useMemo(() => createStyles(currentTheme), [currentTheme]);

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
    setThemeSelection(applicationTheme.theme ?? Theme.SYSTEM);
  }, [applicationTheme.theme]);

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
      dispatch(updateApplicationTheme(mode));
    },
    [dispatch, toggleTheme],
  );

  const handleAccentPress = useCallback(
    (value: Accent) => {
      setAccent(value);
    },
    [setAccent],
  );

  const handleRamadanCountdownToggle = useCallback(
    (value: boolean) => {
      dispatch(setShowRamadanCountdownCard(value));
    },
    [dispatch],
  );

  const handleClearStorage = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      DevSettings.reload();
    } catch (error) {
      console.warn('AsyncStorage clear error:', error);
    }
  }, []);

  const handleSendFeedback = useCallback(() => {
    const subjectText = t(SettingsScreenLanguageConstants.FeedbackEmailSubject.key);
    const bodyLine = t(SettingsScreenLanguageConstants.FeedbackEmailBody.key);
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(`${bodyLine}\n\n`);
    const url = `mailto:gurolmehmetcetin@gmail.com?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'Mail uygulaması açılamadı.');
    });
  }, [t]);

  const closeDropdown = useCallback(() => {
    setIsLangOpen(false);
  }, []);

  return (
    <>
      <ScreenViewContainer>
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
                    backgroundColor: currentTheme.inputBackgroundColor,
                    borderWidth: 1,
                    borderColor: currentTheme.gray,
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
                  size={20}
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
                      size: 18,
                    },
                  },
                  {
                    label: t(ThemeSettingsConstants.Dark.key),
                    value: Theme.DARK,
                    iconProps: {
                      name: themeModeIcons.dark,
                      type: Icons.MaterialDesignIcons,
                      size: 18,
                    },
                  },
                  {
                    label: t(ThemeSettingsConstants.SystemDefault.key),
                    value: Theme.SYSTEM,
                    iconProps: {
                      name: themeModeIcons.system,
                      type: Icons.MaterialDesignIcons,
                      size: 18,
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
                            size={18}
                            color={currentTheme.white}
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Hesaplama Ayarları */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {t(SettingsConstants.CalculateSettings.key)}
              </Text>
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
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    {t(SettingsScreenLanguageConstants.FeedbackTitle.key)}
                  </Text>
                  <Text
                    style={{
                      color: currentTheme.gray,
                      fontSize: 13,
                      marginTop: 6,
                    }}
                  >
                    {t(SettingsScreenLanguageConstants.FeedbackSubtitle.key)}
                  </Text>
                </View>
                <Icon
                  type={Icons.MaterialDesignIcons}
                  name="chevron-right"
                  size={22}
                  color={currentTheme.gray}
                />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </ScreenViewContainer>

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
                                fontSize: 14,
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
                              size={18}
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
