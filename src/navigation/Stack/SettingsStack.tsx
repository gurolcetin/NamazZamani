import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Routes} from '../Routes';
import Settings from '../../screens/Settings/Settings';
import LanguageSettings from '../../screens/LanguageSettings/LanguageSettings';
import ThemeSettings from '../../screens/ThemeSettings/ThemeSettings';
import {useTheme} from '../../../libs/core/providers';
import {useTranslation} from 'react-i18next';

const Stack = createStackNavigator();
export const SettingsStack = () => {
  const {currentTheme} = useTheme();
  const {t} = useTranslation();
  return (
    <Stack.Navigator initialRouteName={Routes.Settings}>
      <Stack.Screen
        name={Routes.Settings}
        component={Settings}
        options={{
          headerShown: false,
          header: () => null,
        }}
      />
      <Stack.Screen
        name={Routes.LanguageSettings}
        component={LanguageSettings}
        options={{
          headerStyle: {backgroundColor: currentTheme.statusBarColor},
          headerTintColor: currentTheme.textColor,
          headerTitle: t('settings.LanguageSettings'),
          headerLeftLabelVisible: false,
          headerLeftContainerStyle: {paddingLeft: 10},
        }}
      />
      <Stack.Screen
        name={Routes.ThemeSettings}
        component={ThemeSettings}
        options={{
          headerStyle: {backgroundColor: currentTheme.statusBarColor},
          headerTintColor: currentTheme.textColor,
          headerTitle: t('settings.ThemeSettings'),
          headerLeftLabelVisible: false,
          headerLeftContainerStyle: {paddingLeft: 10},
        }}
      />
    </Stack.Navigator>
  );
};
