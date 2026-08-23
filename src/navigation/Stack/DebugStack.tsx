import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import DebugScreen from '../../screens/Debug/DebugScreen';
import { useTheme } from '../../../libs/core/providers';

const Stack = createNativeStackNavigator();

export const DebugStack = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: currentTheme.backgroundColor,
        },
        headerTintColor: currentTheme.textColor,
        headerShadowVisible: false,
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="Debug"
        component={DebugScreen}
        options={{
          headerTitle: t('debug.title'),
        }}
      />
    </Stack.Navigator>
  );
};
