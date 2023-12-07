import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StackRoutes} from '../Routes';
import style from './style';
import TabButton from '../../../libs/components/TabButton/TabButton';
import {bottomTabMenuItems} from '../../../libs/constants/menuItems';

const Tab = createBottomTabNavigator();
export const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName={StackRoutes.PrayerTimeStack}
      screenOptions={{
        headerShown: false,
        tabBarStyle: style.tabBar,
        header: () => null,
      }}>
      {bottomTabMenuItems.map((item, index) => (
        <Tab.Screen
          key={item.id}
          name={item.route + item.id}
          component={item.component}
          options={{
            tabBarShowLabel: false,
            tabBarButton: props => <TabButton item={item} {...props} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
};
