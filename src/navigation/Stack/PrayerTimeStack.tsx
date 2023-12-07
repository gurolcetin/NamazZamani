import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import PrayerTime from '../../screens/PrayerTime/PrayerTime';
import {Routes} from '../Routes';

const Stack = createStackNavigator();
export const PrayerTimeStack = () => (
  <Stack.Navigator
    initialRouteName={Routes.PrayerTime}
    screenOptions={{
      headerShown: false,
      header: () => null,
    }}>
    <Stack.Screen name={Routes.PrayerTime} component={PrayerTime} />
  </Stack.Navigator>
);
