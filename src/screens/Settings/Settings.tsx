// Settings.js
import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Theme} from '../../../libs/common/enums';
import {useTheme} from '../../../libs/core/providers';
import {globalStyle} from '../../../libs/styles';
import {CardView} from '../../../libs/components';

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
      <CardView>
        <TouchableOpacity
          style={{height: 70, alignItems: 'center', justifyContent: 'center'}}
          onPress={() => setThemeAndClose(Theme.LIGHT)}>
          <Text style={{color: currentTheme.primary}}>Light Theme</Text>
        </TouchableOpacity>
      </CardView>
      <CardView>
        <TouchableOpacity
          style={{height: 90, alignItems: 'center', justifyContent: 'center'}}
          onPress={() => setThemeAndClose(Theme.DARK)}>
          <Text style={{color: currentTheme.primary}}>Dark Theme</Text>
        </TouchableOpacity>
      </CardView>
      <CardView>
        <TouchableOpacity
          style={{height: 110, alignItems: 'center', justifyContent: 'center'}}
          onPress={() => setThemeAndClose(Theme.SYSTEM)}>
          <Text style={{color: currentTheme.primary}}>System Default</Text>
        </TouchableOpacity>
      </CardView>
    </View>
  );
};

export default Settings;
