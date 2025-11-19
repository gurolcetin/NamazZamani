import React, { useEffect, useState } from 'react';
import {
  RadioButtonVerticalGroup,
  ScreenViewContainer,
} from '../../../../components';
import { useTheme } from '../../../providers';
import { updateApplicationTheme } from '../../../../redux/reducers/ApplicationTheme';
import { useDispatch, useSelector } from 'react-redux';
import { Theme, Accent } from '../../../../common/enums'; // Accent'i ekle
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import {
  ThemeSettingsConstants,
  ThemeSettingsMoonIcon,
  ThemeSettingsSunIcon,
  ThemeSettingsSystemIcon,
} from '../../../../common/constants';
import { Translate } from '../../../helpers';

const ThemeSettings = () => {
  const dispatch = useDispatch();
  const { currentTheme, toggleTheme, accent, setAccent } = useTheme(); // accent + setAccent
  const [initialOption, setInitialOption] = useState<string>(Theme.SYSTEM);
  const applicationTheme = useSelector((state: any) => state.applicationTheme);

  useEffect(() => {
    setInitialOption(applicationTheme.theme);
  }, [applicationTheme.theme]);

  const setThemeAndClose = (selectedOptions: { key: Theme }) => {
    toggleTheme(selectedOptions.key);
    dispatch(updateApplicationTheme(selectedOptions.key));
  };

  const themeOptions = {
    options: [
      {
        iconProps: ThemeSettingsSunIcon(currentTheme),
        title: Translate(ThemeSettingsConstants.Light),
        key: Theme.LIGHT,
        iconBackgroundColor: '#FDD835',
      },
      {
        iconProps: ThemeSettingsMoonIcon(currentTheme),
        title: Translate(ThemeSettingsConstants.Dark),
        key: Theme.DARK,
        iconBackgroundColor: '#333333',
      },
      {
        iconProps: ThemeSettingsSystemIcon(currentTheme),
        title: Translate(ThemeSettingsConstants.SystemDefault),
        key: Theme.SYSTEM,
        iconBackgroundColor: currentTheme.gray,
      },
    ],
  };

  // Accent seçenekleri (enum -> gerçek renk)
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

  const handleAccentPress = (value: Accent) => {
    setAccent(value);
    // Eğer accent'i redux’a da yazmak istiyorsan, burada dispatch edebilirsin.
    // dispatch(updateApplicationAccent(value));
  };

  return (
    <ScreenViewContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Theme seçimi */}
        <RadioButtonVerticalGroup
          onSelect={setThemeAndClose}
          options={themeOptions.options}
          initialOption={initialOption}
        />

        {/* küçük boşluk */}
        <View style={{ height: 16 }} />

        {/* Accent Color Card */}
        <View
          style={[
            styles.accentCard,
            { backgroundColor: currentTheme.cardViewBackgroundColor },
          ]}
        >
          {/* İstersen bu başlığı da Translate ile yapabilirsin */}
          <Text style={[styles.accentTitle, { color: currentTheme.textColor }]}>
            Accent Color
          </Text>

          {/* Seçili rengi preview eden üst bar */}
          <View
            style={[
              styles.accentPreview,
              {
                backgroundColor: accentColorMap[accent],
              },
            ]}
          />

          {/* Renk dot’ları */}
          <View style={styles.accentDotRow}>
            {accentOptions.map(opt => (
              <Pressable
                key={opt}
                onPress={() => handleAccentPress(opt)}
                style={styles.accentDotWrapper}
              >
                <View
                  style={[
                    styles.accentDot,
                    { backgroundColor: accentColorMap[opt] },
                  ]}
                >
                  {accent === opt && <View style={styles.accentDotInner} />}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenViewContainer>
  );
};

const styles = StyleSheet.create({
  accentCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 24,
    // hafif shadow
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  accentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  accentPreview: {
    height: 6,
    borderRadius: 999,
    marginBottom: 14,
    opacity: 0.9,
  },
  accentDotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accentDotWrapper: {
    padding: 4,
  },
  accentDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accentDotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.25)', // seçili efekti
  },
});

export default ThemeSettings;
