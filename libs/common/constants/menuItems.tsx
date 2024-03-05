import {StackRoutes} from '../../../src/navigation/Routes';
import {SettingsStack} from '../../../src/navigation/Stack/SettingsStack';
import Dhikr from '../../../src/screens/Dhikr/Dhikr';
import MissedTracking from '../../../src/screens/MissedTracking/MissedTracking';
import {Icons} from '../../components/Icons/Icons';
import {Translate} from '../../core/helpers';
import {MenuNameLanguageConstants} from './language.constants';
import {MenuIconConstants} from './string.contants';

export const bottomTabMenuItems = currentTheme => [
  // {
  //   id: 1,
  //   route: StackRoutes.PrayerTimeStack,
  //   label: Translate(MenuNameLanguageConstants.PrayerTime),
  //   type: Icons.FontAwesome6,
  //   icon: MenuIconConstants.PrayerTime,
  //   component: PrayerTimeStack,
  //   color: currentTheme.primary,
  //   size: 20,
  // },
  {
    id: 2,
    route: StackRoutes.PrayerTimeStack,
    label: Translate(MenuNameLanguageConstants.MissedTracking),
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.MissedTracking,
    component: MissedTracking,
    color: currentTheme.primary,
    solid: true,
  },
  {
    id: 3,
    route: StackRoutes.PrayerTimeStack,
    label: Translate(MenuNameLanguageConstants.Dhikr),
    type: Icons.MaterialCommunityIcons,
    icon: MenuIconConstants.Dhikr,
    component: Dhikr,
    color: currentTheme.primary,
    solid: true,
  },
  {
    id: 4,
    route: StackRoutes.PrayerTimeStack,
    label: Translate(MenuNameLanguageConstants.Settings),
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.Settings,
    component: SettingsStack,
    color: currentTheme.primary,
  },
];
