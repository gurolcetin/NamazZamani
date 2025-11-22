import React, {
  Fragment,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  BackButton,
  ScreenViewContainer,
} from '../../../libs/components';
import {
  AsyncStorageConstants,
  CalculateSettingsLanguageConstants,
  GeneralLanguageConstants,
  LanguagePrefix,
  LanguageSettingsConstants,
  MenuNameLanguageConstants,
  SettingsConstants,
  SettingsScreenLanguageConstants,
  ThemeSettingsConstants,
} from '../../../libs/common/constants';
import { Accent, Theme } from '../../../libs/common/enums';
import { Translate } from '../../../libs/core/helpers';
import { useTheme } from '../../../libs/core/providers';
import { updateApplicationTheme } from '../../../libs/redux/reducers/ApplicationTheme';
import { updateMenstrualCycle } from '../../../libs/redux/reducers/CalculateSettings';
import { isNullOrEmptyString, isNumber } from 'typescript-util-functions';
import { createStyles } from './style';

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

const themeModeIcons: Record<Theme, string> = {
  [Theme.LIGHT]: 'sunny-outline',
  [Theme.DARK]: 'moon-outline',
  [Theme.SYSTEM]: 'phone-portrait-outline',
};

const normalizeLanguageKey = (value?: string | null) =>
  (value ?? LanguagePrefix.TURKISH).slice(0, 2);

const Settings = ({ navigation }) => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const { currentTheme, toggleTheme, accent, setAccent, gradient } = useTheme();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const calculateSettings = useSelector(
    (state: any) => state.calculateSettings,
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    LanguagePrefix.TURKISH,
  );
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false);
  const [themeSelection, setThemeSelection] = useState<Theme>(Theme.SYSTEM);
  const [menstrualDays, setMenstrualDays] = useState<string>('');
  const styles = useMemo(() => createStyles(currentTheme), [currentTheme]);

  const canGoBack = navigation?.canGoBack?.() ?? false;

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
    setMenstrualDays(
      String(calculateSettings?.numberOfMenstrualCycle ?? ''),
    );
  }, [calculateSettings?.numberOfMenstrualCycle]);

  const languageOptions = [
    {
      key: LanguagePrefix.TURKISH,
      title: Translate(LanguageSettingsConstants.Turkish),
      flag: require('../../../assets/images/flags/turkey.png'),
    },
    {
      key: LanguagePrefix.ENGLISH,
      title: Translate(LanguageSettingsConstants.English),
      flag: require('../../../assets/images/flags/united-kingdom.png'),
    },
  ];

  const selectedLanguageOption =
    languageOptions.find(option => option.key === selectedLanguage) ||
    languageOptions[0];

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setLanguageDropdownVisible(false);
      if (lang === selectedLanguage) {
        return;
      }
      i18n.changeLanguage(lang);
      setSelectedLanguage(lang);
    },
    [i18n, selectedLanguage],
  );

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

  const handleMenstrualDaysChange = useCallback(
    (value: string) => {
      if (isNullOrEmptyString(value)) {
        setMenstrualDays('');
        return;
      }
      if (!isNumber(value)) {
        return;
      }
      const numeric = Math.min(Math.max(Number(value), 0), 10);
      setMenstrualDays(numeric.toString());
    },
    [],
  );

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

  const themeOptions = [
    {
      key: Theme.LIGHT,
      label: Translate(ThemeSettingsConstants.Light),
    },
    {
      key: Theme.DARK,
      label: Translate(ThemeSettingsConstants.Dark),
    },
    {
      key: Theme.SYSTEM,
      label: Translate(ThemeSettingsConstants.SystemDefault),
    },
  ];

  return (
    <ScreenViewContainer>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {canGoBack ? (
            <BackButton
              onPress={() => navigation.goBack()}
              backgroundColor={currentTheme.cardViewBackgroundColor}
              iconColor={currentTheme.textColor}
            />
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <Text style={styles.headerTitle}>
            {Translate(MenuNameLanguageConstants.Settings)}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {Translate(SettingsScreenLanguageConstants.Language)}
          </Text>
          <Pressable
            style={[
              styles.languageButton,
              {
                backgroundColor: currentTheme.inputBackgroundColor,
                borderWidth: 1,
                borderColor: currentTheme.gray,
              },
            ]}
            onPress={() =>
              setLanguageDropdownVisible(prevState => !prevState)
            }
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
            <Ionicons
              name={languageDropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={currentTheme.textColor}
            />
          </Pressable>
          {languageDropdownVisible && (
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: currentTheme.cardViewBackgroundColor,
                  borderWidth: 1,
                  borderColor: currentTheme.gray,
                },
              ]}
            >
              {languageOptions.map((option, index) => (
                <Fragment key={option.key}>
                  <Pressable
                    style={styles.dropdownOption}
                    onPress={() => handleLanguageChange(option.key)}
                    android_ripple={{
                      color: currentTheme.inputBackgroundColor,
                      borderless: false,
                    }}
                  >
                    <View style={styles.languageInfo}>
                      <Image source={option.flag} style={styles.flag} />
                      <Text
                        style={[
                          styles.languageText,
                          { color: currentTheme.textColor },
                        ]}
                      >
                        {option.title}
                      </Text>
                    </View>
                    {selectedLanguage === option.key && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={currentTheme.primary}
                      />
                    )}
                  </Pressable>
                  {index !== languageOptions.length - 1 && (
                    <View
                      style={[
                        styles.dropdownDivider,
                        { backgroundColor: currentTheme.gray },
                      ]}
                    />
                  )}
                </Fragment>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {Translate(SettingsScreenLanguageConstants.ThemeAndAccent)}
          </Text>
          <Text style={styles.themeSectionLabel}>
            {Translate(SettingsScreenLanguageConstants.ThemeMode)}
          </Text>
          <View
            style={[
              styles.themeOptionsRow,
              { backgroundColor: currentTheme.inputBackgroundColor },
            ]}
          >
            {themeOptions.map(option => {
              const isActive = themeSelection === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive
                        ? currentTheme.primary
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleThemeChange(option.key)}
                  android_ripple={{
                    color: currentTheme.gray,
                    borderless: false,
                  }}
                >
                  <Ionicons
                    name={themeModeIcons[option.key]}
                    size={18}
                    color={isActive ? currentTheme.white : currentTheme.textColor}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      {
                        color: isActive
                          ? currentTheme.white
                          : currentTheme.textColor,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text
            style={[
              styles.themeSectionLabel,
              {
                marginTop: 18,
              },
            ]}
          >
            {Translate(SettingsScreenLanguageConstants.AccentColor)}
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
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {Translate(SettingsConstants.CalculateSettings)}
          </Text>
          <Text style={styles.label}>
            {Translate(
              CalculateSettingsLanguageConstants.NumberOfMenstrualDays,
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
            {Translate(SettingsScreenLanguageConstants.CalculationHelper)}
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
              {Translate(GeneralLanguageConstants.Save)}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default Settings;
