import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Routes} from '../Routes';
import Settings from '../../screens/Settings/Settings';
import LanguageSettings from '../../../libs/core/sections/Settings/LanguageSettings/LanguageSettings';
import ThemeSettings from '../../../libs/core/sections/Settings/ThemeSettings/ThemeSettings';
import {useTheme} from '../../../libs/core/providers';
import {Translate} from '../../../libs/core/helpers';
import {SettingsConstants} from '../../../libs/common/constants';
import CalculateSettings from '../../../libs/core/sections/Settings/CalculateSettings/CalculateSettings';

const Stack = createStackNavigator();
export const SettingsStack = () => {
  const {currentTheme} = useTheme();
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
          headerStyle: {
            backgroundColor: currentTheme.statusBarColor,
          },
          headerStatusBarHeight: 0,
          headerTintColor: currentTheme.textColor,
          headerTitle: Translate(SettingsConstants.LanguageSettings),
          headerLeftLabelVisible: false,
          headerLeftContainerStyle: {paddingLeft: 10},
        }}
      />
      <Stack.Screen
        name={Routes.ThemeSettings}
        component={ThemeSettings}
        options={{
          headerStyle: {
            backgroundColor: currentTheme.statusBarColor,
          },
          headerStatusBarHeight: 0,
          headerTintColor: currentTheme.textColor,
          headerTitle: Translate(SettingsConstants.ThemeSettings),
          headerLeftLabelVisible: false,
          headerLeftContainerStyle: {paddingLeft: 10},
        }}
      />
      <Stack.Screen
        name={Routes.CalculateSettings}
        component={CalculateSettings}
        options={{
          headerStyle: {
            backgroundColor: currentTheme.statusBarColor,
          },
          headerStatusBarHeight: 0,
          headerTintColor: currentTheme.textColor,
          headerTitle: Translate(SettingsConstants.CalculateSettings),
          headerLeftLabelVisible: false,
          headerLeftContainerStyle: {paddingLeft: 10},
        }}
      />
    </Stack.Navigator>
  );
};
