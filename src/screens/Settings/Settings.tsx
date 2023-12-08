import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Theme} from '../../../libs/common/enums';
import {useTheme} from '../../../libs/core/providers';
import {globalStyle} from '../../../libs/styles';
import {
  CardView,
  Icons,
  RadioButtonVerticalGroup,
} from '../../../libs/components';

const Settings = () => {
  const {theme, toggleTheme, currentTheme} = useTheme();
  const [initialOption, setInitialOption] = useState<string>(Theme.SYSTEM);
  useEffect(() => {
    getStoredTheme();
  }, []);

  const setThemeAndClose = async selectedOptions => {
    toggleTheme(selectedOptions.key);

    try {
      // AsyncStorage'e seçilen temayı kaydet
      await AsyncStorage.setItem('theme', selectedOptions.key);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const getStoredTheme = async () => {
    const storedTheme = await AsyncStorage.getItem('theme');
    setInitialOption(storedTheme || Theme.SYSTEM);
  };

  const options = {
    options: [
      {
        iconProps: {
          name: 'sun',
          type: Icons.FontAwesome6,
          color: currentTheme.primary,
          size: 30,
          solid: true,
        },
        title: 'Light',
        key: Theme.LIGHT,
      },
      {
        iconProps: {
          name: 'moon',
          type: Icons.FontAwesome6,
          color: currentTheme.primary,
          size: 30,
          solid: true,
        },
        title: 'Dark',
        key: Theme.DARK,
      },
      {
        iconProps: {
          name: 'gear',
          type: Icons.FontAwesome6,
          color: currentTheme.primary,
          size: 30,
          solid: true,
        },
        title: 'System Default',
        key: Theme.SYSTEM,
      },
    ],
    iconPropsRadioButton: {
      name: 'check',
      type: Icons.FontAwesome6,
      color: currentTheme.primary,
      size: 20,
      solid: true,
    },
  };

  return (
    <View
      style={[
        globalStyle.flex1,
        {backgroundColor: currentTheme.backgroundColor},
      ]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <CardView title="Theme Settings">
          <RadioButtonVerticalGroup
            onSelect={setThemeAndClose}
            options={options.options}
            iconPropsRadioButton={options.iconPropsRadioButton}
            initialOption={initialOption}
          />
        </CardView>
      </ScrollView>
    </View>
  );
};

export default Settings;
