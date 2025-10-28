import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StackRoutes} from '../Routes';
import style from './style';
import {bottomTabMenuItems} from '../../../libs/common/constants';
import {TabButton} from '../../../libs/components';
import {useTheme} from '../../../libs/core/providers';

const Tab = createBottomTabNavigator();
export const TabNavigator = () => {
  const {currentTheme} = useTheme();

  return (
    <Tab.Navigator
      initialRouteName={`${StackRoutes.PrayerTimeStack}1`}
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          style.tabBar,
          {
            backgroundColor: currentTheme.menuBackgroundColor,
            borderTopColor: currentTheme.menuBorderColor,
            borderLeftColor: currentTheme.menuBorderColor,
            borderRightColor: currentTheme.menuBorderColor,
          },
        ],
        header: () => null,
      }}>
      {bottomTabMenuItems(currentTheme).map((item) => (
        <Tab.Screen
          key={item.id}
          name={item.route + item.id}
          component={item.component}
          options={{
            headerShown: false,
            header: () => null,
            tabBarShowLabel: false,
            // eslint-disable-next-line react/no-unstable-nested-components
            tabBarButton: props => <TabButton item={item} {...props} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
};
