// PrayerTimeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PrayerTime from '../../screens/PrayerTime/PrayerTime';
import { Routes } from '../Routes';
import LocationSelector from '../../screens/PrayerTime/location-selector/location-selector';
import { useTheme } from '../../../libs/core/providers';

const Stack = createNativeStackNavigator();

export const PrayerTimeStack = () => {
  const { currentTheme } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName={Routes.PrayerTime}
      screenOptions={{
        headerShown: false,
        header: () => null,
      }}
    >
      <Stack.Screen
        name={Routes.PrayerTime}
        component={PrayerTime}
        options={{ headerShown: false, header: () => null }}
      />
      <Stack.Screen
        name={Routes.LocationSelector}
        component={LocationSelector}
        options={{
          headerStyle: {
            backgroundColor: currentTheme.statusBarColor,
          },
          headerTintColor: currentTheme.textColor,
          headerTitle: 'test',
          headerBackTitle: 'geritest',
        }}
      />
    </Stack.Navigator>
  );
};
