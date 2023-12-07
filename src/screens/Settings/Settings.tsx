// Settings.js
import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Theme} from '../../../libs/common/enums';
import {useTheme} from '../../../libs/core/providers';
import {globalStyle} from '../../../libs/styles';

const Settings = () => {
  const {theme, toggleTheme, currentTheme} = useTheme();

  const setThemeAndClose = async selectedTheme => {
    toggleTheme(selectedTheme);

    try {
      // AsyncStorage'e seçilen temayı kaydet
      await AsyncStorage.setItem('theme', selectedTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const getStoredTheme = async () => {
    try {
      // AsyncStorage'den kaydedilen temayı al
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        toggleTheme(storedTheme as Theme);
      }
    } catch (error) {
      console.error('Error getting stored theme:', error);
    }
  };

  return (
    <View
      style={[
        globalStyle.flex1,
        {backgroundColor: currentTheme.backgroundColor},
      ]}>
      <View
        style={{
          marginTop: 50,
          marginHorizontal: 10,
          height: 50,
          borderRadius: 15,
          backgroundColor: currentTheme.menuBackgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <TouchableOpacity onPress={() => setThemeAndClose(Theme.LIGHT)}>
          <Text style={{color: currentTheme.primary}}>Light Theme</Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          marginTop: 50,
          marginHorizontal: 10,
          height: 50,
          borderRadius: 15,
          backgroundColor: currentTheme.menuBackgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <TouchableOpacity onPress={() => setThemeAndClose(Theme.DARK)}>
          <Text style={{color: currentTheme.primary}}>Dark Theme</Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          marginTop: 50,
          marginHorizontal: 10,
          height: 50,
          borderRadius: 15,
          backgroundColor: currentTheme.menuBackgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <TouchableOpacity onPress={() => setThemeAndClose(Theme.SYSTEM)}>
          <Text style={{color: currentTheme.primary}}>System Default</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Settings;
