import React from 'react';
import { PrayerTimeScreens, StackRoutes } from './Routes';
import BottomTabNavigator from './BottomTab/BottomTab';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LocationSelector from '../screens/PrayerTime/location-selector/location-selector';
import { useTheme } from '../../libs/core/providers';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator();
export const Authenticated = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerLargeTitle: false,
      }}
    >
      <Stack.Screen
        name={StackRoutes.TabStack}
        component={BottomTabNavigator}
        options={{
          headerShown: false,
          header: () => null,
        }}
      />
      <Stack.Group
        screenOptions={({}) => ({
          headerShown: true,
          headerShadowVisible: true,
          headerBackVisible: true,
          headerTintColor: currentTheme.textColor,
          headerBackTitle: '',
          headerBackTitleVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          // headerBlurEffect: 'systemThinMaterial',
          // headerTransparent: Platform.OS === 'ios',
        })}
      >
        <Stack.Screen
          name={PrayerTimeScreens.LocationSelector}
          component={LocationSelector}
          options={{
            headerTitle: t('locationSelector.locationSelect'),
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};
