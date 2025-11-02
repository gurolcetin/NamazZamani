import React from 'react';
import { StackRoutes } from './Routes';
import { SafeAreaWithStatusBar } from '../../libs/components';
import BottomTabNavigator from './BottomTab/BottomTab';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
export const Authenticated = () => {
  return (
    <SafeAreaWithStatusBar>
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
      </Stack.Navigator>
    </SafeAreaWithStatusBar>
  );
};
