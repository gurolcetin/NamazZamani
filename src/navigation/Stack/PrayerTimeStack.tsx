import React from 'react';
import PrayerTime from '../../screens/PrayerTime/PrayerTime';
import { Routes } from '../Routes';
import { useTheme } from '../../../libs/core/providers';
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
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
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
    </Stack.Navigator>
  );
};
