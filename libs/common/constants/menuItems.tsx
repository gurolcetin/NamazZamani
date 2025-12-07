import { StackRoutes } from '../../../src/navigation/Routes';
import { PrayerTimeStack } from '../../../src/navigation/Stack/PrayerTimeStack';
import { SettingsStack } from '../../../src/navigation/Stack/SettingsStack';
import Dhikr from '../../../src/screens/Dhikr/Dhikr';
import MissedTracking from '../../../src/screens/MissedTracking/MissedTracking';
import { Icons } from '../../components/Icons/Icons';
import { ThemeType } from '../models';
import { MenuNameLanguageConstants } from './language.constants';
import { MenuIconConstants } from './string.contants';

export const bottomTabMenuItems = (currentTheme: ThemeType) => [
  {
    id: 1,
    route: StackRoutes.PrayerTimeStack,
    label: MenuNameLanguageConstants.PrayerTime,
    type: Icons.MaterialDesignIcons,
    icon: MenuIconConstants.PrayerTime,
    component: PrayerTimeStack,
    color: currentTheme.primary,
    size: 22,
    solid: true,
    headerShown: false,
  },
  {
    id: 2,
    route: StackRoutes.MissedTrackingStack,
    label: MenuNameLanguageConstants.MissedTracking,
    type: Icons.MaterialDesignIcons,
    icon: MenuIconConstants.MissedTracking,
    component: MissedTracking,
    color: currentTheme.primary,
    size: 22,
    solid: true,
    headerShown: true,
  },
  {
    id: 3,
    route: StackRoutes.DhikrStack,
    label: MenuNameLanguageConstants.Dhikr,
    type: Icons.MaterialDesignIcons,
    icon: MenuIconConstants.Dhikr,
    component: Dhikr,
    color: currentTheme.primary,
    size: 22,
    solid: true,
    headerShown: true,
  },
  {
    id: 4,
    route: StackRoutes.SettingsStack,
    label: MenuNameLanguageConstants.Settings,
    type: Icons.MaterialDesignIcons,
    icon: MenuIconConstants.Settings,
    component: SettingsStack,
    color: currentTheme.primary,
    size: 22,
    solid: true,
    headerShown: false,
  },
];
