import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {TabNavigator} from './BottomTab/BottomTab';
import {StackRoutes} from './Routes';

const Stack = createStackNavigator();
export const Authenticated = () => {
  return (
    <Stack.Navigator
      initialRouteName={StackRoutes.TabStack}
      screenOptions={{header: () => null, headerShown: false}}>
      <Stack.Screen name={StackRoutes.TabStack} component={TabNavigator} />
    </Stack.Navigator>
  );
};
