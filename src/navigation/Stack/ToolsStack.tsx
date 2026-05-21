import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../libs/core/providers';
import { ToolsRoutes } from '../Routes';
import ToolsHub from '../../screens/Tools/ToolsHub';
import MissedTracking from '../../screens/MissedTracking/MissedTracking';
import Dhikr from '../../screens/Dhikr/Dhikr';
import MonthlyCalendar from '../../screens/PrayerTime/MontlyCalendar/montly-calendar';
import TimeTable from '../../screens/PrayerTime/time-table/time-table';
import QiblaScreen from '../../screens/PrayerTime/qibla/qibla-finder';

const Stack = createNativeStackNavigator();

export const ToolsStack = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      initialRouteName={ToolsRoutes.ToolsHub}
      screenOptions={({}) => ({
        headerStyle: {
          backgroundColor: currentTheme.backgroundColor,
        },
        headerTitle: '',
        headerShadowVisible: false,
        contentStyle: {},
      })}
    >
      <Stack.Screen
        name={ToolsRoutes.ToolsHub}
        component={ToolsHub}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ToolsRoutes.MissedTracking}
        component={MissedTracking}
        options={{
          headerTitle: t('menu.MissedTracking'),
        }}
      />
      <Stack.Screen
        name={ToolsRoutes.Dhikr}
        component={Dhikr}
        options={{
          headerTitle: t('menu.Dhikr'),
        }}
      />

        <Stack.Screen
          name={ToolsRoutes.MontlyCalendar}
          component={MonthlyCalendar}
          options={{
            headerTitle: t('actionCardGroup.pickDate'),
          }}
        />
        <Stack.Screen
          name={ToolsRoutes.Imsakiye}
          component={TimeTable}
          options={{
            headerTitle: t('actionCardGroup.imsakiye'),
          }}
        />
        <Stack.Screen
          name={ToolsRoutes.Qibla}
          component={QiblaScreen}
          options={{
            headerTitle: t('actionCardGroup.qibla'),
          }}
        />
    </Stack.Navigator>
  );
};
