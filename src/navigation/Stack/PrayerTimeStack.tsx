import React from 'react';
import PrayerTime from '../../screens/PrayerTime/PrayerTime';
import { PrayerTimeScreens, Routes } from '../Routes';
import LocationSelector from '../../screens/PrayerTime/location-selector/location-selector';
import MonthlyCalendar from '../../screens/PrayerTime/MontlyCalendar/montly-calendar';
import { useTheme } from '../../../libs/core/providers';
import TimeTable from '../../screens/PrayerTime/time-table/time-table';
import QiblaScreen from '../../screens/PrayerTime/qibla/qibla-finder';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export const PrayerTimeStack = () => {
  const { currentTheme } = useTheme();
  return (
    <Stack.Navigator initialRouteName={Routes.PrayerTime}>
      <Stack.Screen
        name={Routes.PrayerTime}
        component={PrayerTime}
        options={{ headerShown: false, headerLargeTitle: true }}
      />
      <Stack.Screen
        name={PrayerTimeScreens.LocationSelector}
        component={LocationSelector}
        options={{
          headerStyle: {
            backgroundColor: currentTheme.statusBarColor,
          },
          headerTitle: '',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name={PrayerTimeScreens.MontlyCalendar}
        component={MonthlyCalendar}
        options={{
          headerStyle: {
            backgroundColor: currentTheme.statusBarColor,
          },
          headerTitle: '',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name={PrayerTimeScreens.Imsakiye}
        component={TimeTable}
        options={{
          headerStyle: {
            backgroundColor: currentTheme.statusBarColor,
          },
          headerTitle: '',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name={PrayerTimeScreens.Qibla}
        component={QiblaScreen}
        options={{
          headerStyle: {
            backgroundColor: currentTheme.statusBarColor,
          },
          headerTitle: '',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};
