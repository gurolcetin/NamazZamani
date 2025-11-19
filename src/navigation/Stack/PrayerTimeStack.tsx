import React from 'react';
import PrayerTime from '../../screens/PrayerTime/PrayerTime';
import { PrayerTimeScreens, Routes } from '../Routes';
import LocationSelector from '../../screens/PrayerTime/location-selector/location-selector';
import MonthlyCalendar from '../../screens/PrayerTime/MontlyCalendar/montly-calendar';
import { useTheme } from '../../../libs/core/providers';
import TimeTable from '../../screens/PrayerTime/time-table/time-table';
import QiblaScreen from '../../screens/PrayerTime/qibla/qibla-finder';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BackButton } from '../../../libs/components';

const Stack = createNativeStackNavigator();

export const PrayerTimeStack = () => {
  const { currentTheme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName={Routes.PrayerTime}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: currentTheme.backgroundColor,
        },
        headerTitle: '',
        headerShadowVisible: false,
        contentStyle: {
          paddingTop: 20,
        },
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <BackButton
              onPress={navigation.goBack}
              backgroundColor={currentTheme.cardViewBackgroundColor}
              iconColor={currentTheme.textColor}
            />
          ) : null,
      })}
    >
      <Stack.Screen
        name={Routes.PrayerTime}
        component={PrayerTime}
        options={{
          headerShown: false, // sadece bu ekranda header yok
          contentStyle: undefined, // istersen paddingTop burada sıfırlayabilirsin
        }}
      />

      <Stack.Screen
        name={PrayerTimeScreens.LocationSelector}
        component={LocationSelector}
      />

      <Stack.Screen
        name={PrayerTimeScreens.MontlyCalendar}
        component={MonthlyCalendar}
      />

      <Stack.Screen name={PrayerTimeScreens.Imsakiye} component={TimeTable} />

      <Stack.Screen name={PrayerTimeScreens.Qibla} component={QiblaScreen} />
    </Stack.Navigator>
  );
};
