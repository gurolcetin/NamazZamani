// Settings.js
import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Theme} from '../../../libs/common/enums';
import {useTheme} from '../../../libs/core/providers';
import {globalStyle} from '../../../libs/styles';
import {
  CardView,
  Icons,
  RadioButtonVerticalGroup,
  RadioButtonVerticalGroupProps,
} from '../../../libs/components';

const Settings = () => {
  const {theme, toggleTheme, currentTheme} = useTheme();

  const setThemeAndClose = async selectedOptions => {
    // console.log('selectedOptions', selectedOptions);
    toggleTheme(selectedOptions.key);

    try {
      // AsyncStorage'e seçilen temayı kaydet
      await AsyncStorage.setItem('theme', selectedOptions.key);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const getStoredTheme = async () => {
    // AsyncStorage'den kaydedilen temayı al
    const storedTheme = await AsyncStorage.getItem('theme');
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
      <CardView>
        <RadioButtonVerticalGroup
          onSelect={setThemeAndClose}
          options={options.options}
          iconPropsRadioButton={options.iconPropsRadioButton}
        />
      </CardView>
    </View>
  );
};

export default Settings;
