import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {TabNavigator} from './BottomTab/BottomTab';
import {StackRoutes} from './Routes';
import {useTheme} from '../../libs/core/providers';

const Stack = createStackNavigator();
export const Authenticated = () => {
  const {currentTheme} = useTheme();
  return (
    <Stack.Navigator
      initialRouteName={StackRoutes.TabStack}
      screenOptions={{header: () => null, headerShown: false}}>
      <Stack.Screen
        name={StackRoutes.TabStack}
        component={TabNavigator}
        options={{cardStyle: {backgroundColor: currentTheme.backgroundColor}}}
      />
    </Stack.Navigator>
  );
};
