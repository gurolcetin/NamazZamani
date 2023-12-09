import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Routes} from '../Routes';
import Settings from '../../screens/Settings/Settings';
import LanguageSettings from '../../screens/LanguageSettings/LanguageSettings';
import ThemeSettings from '../../screens/ThemeSettings/ThemeSettings';

const Stack = createStackNavigator();
export const SettingsStack = () => (
  <Stack.Navigator
    initialRouteName={Routes.Settings}
    screenOptions={{
      headerShown: false,
      header: () => null,
    }}>
    <Stack.Screen name={Routes.Settings} component={Settings} />
    <Stack.Screen name={Routes.LanguageSettings} component={LanguageSettings} />
    <Stack.Screen name={Routes.ThemeSettings} component={ThemeSettings} />
  </Stack.Navigator>
);
