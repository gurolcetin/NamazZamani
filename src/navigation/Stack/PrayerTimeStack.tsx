// PrayerTimeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PrayerTime from '../../screens/PrayerTime/PrayerTime';
import { PrayerTimeScreens, Routes } from '../Routes';
import LocationSelector from '../../screens/PrayerTime/location-selector/location-selector';
import MonthlyCalendar from '../../screens/PrayerTime/MontlyCalendar/montly-calendar';
import { useTheme } from '../../../libs/core/providers';
import TimeTable from '../../screens/PrayerTime/time-table/time-table';

const Stack = createNativeStackNavigator();

export const PrayerTimeStack = () => {
  const { currentTheme } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName={Routes.PrayerTime}
      screenOptions={{
        headerShown: true, // varsayılan açık olsun
        headerBackTitle: 'Prayer Time',
        headerTintColor: currentTheme.primary,
      }}
    >
      <Stack.Screen
        name={Routes.PrayerTime}
        component={PrayerTime}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={PrayerTimeScreens.LocationSelector}
        component={LocationSelector}
        options={{
          title: '', // isteğe bağlı
          gestureEnabled: true, // kaydırma ile geri
        }}
      />
      <Stack.Screen
        name={PrayerTimeScreens.MontlyCalendar}
        component={MonthlyCalendar}
        options={{
          title: '',
          gestureEnabled: true, // kaydırma ile geri
        }}
      />
      <Stack.Screen
        name={PrayerTimeScreens.Imsakiye}
        component={TimeTable}
        options={{
          title: '',
          gestureEnabled: true, // kaydırma ile geri
        }}
      />
    </Stack.Navigator>
  );
};
