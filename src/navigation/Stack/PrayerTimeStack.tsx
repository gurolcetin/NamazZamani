// PrayerTimeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PrayerTime from '../../screens/PrayerTime/PrayerTime';
import { PrayerTimeScreens, Routes } from '../Routes';
import LocationSelector from '../../screens/PrayerTime/location-selector/location-selector';
import MonthlyCalendar from '../../screens/PrayerTime/MontlyCalendar/montly-calendar';

const Stack = createNativeStackNavigator();

export const PrayerTimeStack = () => {
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
        name={PrayerTimeScreens.LocationSelector}
        component={LocationSelector}
        options={{
          header: () => null,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={PrayerTimeScreens.MontlyCalendar}
        component={MonthlyCalendar}
        options={{
          header: () => null,
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
