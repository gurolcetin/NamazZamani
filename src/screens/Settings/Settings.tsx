import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
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
  CalculateSettingsLanguageConstants,
  GeneralLanguageConstants,
  LanguagePrefix,
  LanguageSettingsConstants,
  SettingsConstants,
  SettingsScreenLanguageConstants,
  ThemeSettingsConstants,
} from '../../../libs/common/constants';
import { Accent, Theme } from '../../../libs/common/enums';
import { useTheme } from '../../../libs/core/providers';
import { updateApplicationTheme } from '../../../libs/redux/reducers/ApplicationTheme';
import { updateMenstrualCycle } from '../../../libs/redux/reducers/CalculateSettings';
import { isNullOrEmptyString, isNumber } from 'typescript-util-functions';
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
  const { currentTheme, toggleTheme, accent, setAccent, gradient } = useTheme();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const calculateSettings = useSelector(
    (state: any) => state.calculateSettings,
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
  const [menstrualDays, setMenstrualDays] = useState<string>('');

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

  useEffect(() => {
    if (
      calculateSettings?.numberOfMenstrualCycle === undefined ||
      calculateSettings?.numberOfMenstrualCycle === null
    ) {
      setMenstrualDays('');
      return;
    }
    setMenstrualDays(String(calculateSettings?.numberOfMenstrualCycle ?? ''));
  }, [calculateSettings?.numberOfMenstrualCycle]);

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

  const handleMenstrualDaysChange = useCallback((value: string) => {
    if (isNullOrEmptyString(value)) {
      setMenstrualDays('');
      return;
    }
    if (!isNumber(value)) {
      return;
    }
    const numeric = Math.min(Math.max(Number(value), 0), 10);
    setMenstrualDays(numeric.toString());
  }, []);

  const handleSave = useCallback(() => {
    if (isNullOrEmptyString(menstrualDays)) {
      dispatch(
        updateMenstrualCycle({
          numberOfMenstrualCycle: undefined,
        }),
      );
      return;
    }
    if (!isNumber(menstrualDays)) {
      return;
    }
    const numeric = Math.min(Math.max(Number(menstrualDays), 0), 10);
    dispatch(
      updateMenstrualCycle({
        numberOfMenstrualCycle: numeric,
      }),
    );
  }, [dispatch, menstrualDays]);

  const handleClearStorage = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      DevSettings.reload();
    } catch (error) {
      console.warn('AsyncStorage clear error:', error);
    }
  }, []);

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
              <Text style={styles.label}>
                {t(
                  CalculateSettingsLanguageConstants.NumberOfMenstrualDays.key,
                )}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.inputBackgroundColor,
                    color: currentTheme.textColor,
                  },
                ]}
                value={menstrualDays}
                onChangeText={handleMenstrualDaysChange}
                keyboardType="numeric"
                placeholder="7"
                placeholderTextColor={currentTheme.placeholderTextColor}
                maxLength={2}
              />
              <Text
                style={[
                  styles.helperText,
                  {
                    color: currentTheme.gray,
                  },
                ]}
              >
                {t(SettingsScreenLanguageConstants.CalculationHelper.key)}
              </Text>
              <Pressable
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: gradient?.[0] ?? currentTheme.primary,
                    shadowColor: gradient?.[0] ?? currentTheme.primary,
                  },
                ]}
                onPress={handleSave}
                android_ripple={{
                  color: currentTheme.gray,
                  borderless: false,
                }}
              >
                <Text style={styles.saveButtonLabel}>
                  {t(GeneralLanguageConstants.Save.key)}
                </Text>
              </Pressable>
            </View>

            {/* Gelişmiş */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Gelişmiş</Text>
              <Text
                style={[
                  styles.helperText,
                  { color: currentTheme.gray, marginBottom: 12 },
                ]}
              >
                Uygulamaya ait tüm yerel verileri (dil, tema, hesaplama ayarları
                vb.) temizler. Uygulama bazı alanlarda varsayılan ayarlara
                döner.
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
                <Text style={styles.saveButtonLabel}>Tüm verileri temizle</Text>
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
