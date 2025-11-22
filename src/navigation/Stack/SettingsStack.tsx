import React from 'react';
import { Routes } from '../Routes';
import Settings from '../../screens/Settings/Settings';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
export const SettingsStack = () => {
  return (
    <Stack.Navigator initialRouteName={Routes.Settings}>
      <Stack.Screen
        name={Routes.Settings}
        component={Settings}
        options={{
          headerShown: false,
          header: () => null,
        }}
      />
    </Stack.Navigator>
  );
};
