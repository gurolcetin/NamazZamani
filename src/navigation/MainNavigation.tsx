import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {TabNavigator} from './BottomTab/BottomTab';
import {StackRoutes} from './Routes';
import {useTheme} from '../../libs/core/providers';
import {SafeAreaWithStatusBar} from '../../libs/components';

const Stack = createStackNavigator();
export const Authenticated = () => {
  const {currentTheme} = useTheme();
  return (
    <SafeAreaWithStatusBar>
      <Stack.Navigator
        initialRouteName={StackRoutes.TabStack}
        screenOptions={{header: () => null, headerShown: false}}>
        <Stack.Screen
          name={StackRoutes.TabStack}
          component={TabNavigator}
          options={{
            cardStyle: {backgroundColor: currentTheme.backgroundColor},
            headerShown: false,
            header: () => null,
          }}
        />
      </Stack.Navigator>
    </SafeAreaWithStatusBar>
  );
};
