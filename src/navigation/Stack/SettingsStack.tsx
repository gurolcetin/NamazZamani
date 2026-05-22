import React from 'react';
import { Routes } from '../Routes';
import Settings from '../../screens/Settings/Settings';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuNameLanguageConstants } from '../../../libs/common/constants';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator();
export const SettingsStack = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      initialRouteName={Routes.Settings}
      screenOptions={{
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name={Routes.Settings}
        component={Settings}
        options={{
          headerTitle: t(MenuNameLanguageConstants.Settings.key),
        }}
      />
    </Stack.Navigator>
  );
};
