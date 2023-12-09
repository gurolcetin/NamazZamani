import {StackRoutes} from '../../../src/navigation/Routes';
import {PrayerTimeStack} from '../../../src/navigation/Stack/PrayerTimeStack';
import {SettingsStack} from '../../../src/navigation/Stack/SettingsStack';
import Settings from '../../../src/screens/Settings/Settings';
import {Icons} from '../../components/Icons/Icons';
import {MenuNameConstants, MenuIconConstants} from './string.contants';

export const bottomTabMenuItems = currentTheme => [
  {
    id: 1,
    route: StackRoutes.PrayerTimeStack,
    label: MenuNameConstants.PrayerTime,
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.PrayerTime,
    component: PrayerTimeStack,
    color: currentTheme.primary,
    size: 20,
  },
  {
    id: 2,
    route: StackRoutes.PrayerTimeStack,
    label: MenuNameConstants.MissedPrayer,
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.MissedPrayer,
    component: PrayerTimeStack,
    color: currentTheme.primary,
    solid: true,
  },
  {
    id: 3,
    route: StackRoutes.PrayerTimeStack,
    label: MenuNameConstants.Settings,
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.Settings,
    component: SettingsStack,
    color: currentTheme.primary,
  },
];
