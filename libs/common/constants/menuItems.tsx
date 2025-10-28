import {StackRoutes} from '../../../src/navigation/Routes';
import {SettingsStack} from '../../../src/navigation/Stack/SettingsStack';
import Dhikr from '../../../src/screens/Dhikr/Dhikr';
import MissedTracking from '../../../src/screens/MissedTracking/MissedTracking';
import PrayerTime from '../../../src/screens/PrayerTime/PrayerTime';
import {Icons} from '../../components/Icons/Icons';
import {Translate} from '../../core/helpers';
import {MenuNameLanguageConstants} from './language.constants';
import {MenuIconConstants} from './string.contants';

export const bottomTabMenuItems = (currentTheme: { primary: any; backgroundColor?: string; statusBarColor?: string; menuBackgroundColor?: string; menuBorderColor?: string; cardViewBackgroundColor?: string; cardViewBorderColor?: string; textColor?: string; white?: string; black?: string; gray?: string; languageIconBackgroundColor?: string; activeTabTextColor?: string; passiveTabTextColor?: string; inputBackgroundColor?: string; inputColor?: string; segmentedControlBackgroundColor?: string; segmentedControlSelectedBackgroundColor?: string; segmentedControlTextColor?: string; formErrorColor?: string; systemGreen?: string; systemRed?: string; infoIconColor?: string; calculateIconColor?: string; systemBlue?: string; shadowColor?: string; }) => [
  {
    id: 1,
    route: StackRoutes.PrayerTimeStack,
    label: Translate(MenuNameLanguageConstants.PrayerTime),
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.PrayerTime,
    component: PrayerTime,
    color: currentTheme.primary,
    size: 20,
    solid: true
  },
  {
    id: 2,
    route: StackRoutes.PrayerTimeStack,
    label: Translate(MenuNameLanguageConstants.MissedTracking),
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.MissedTracking,
    component: MissedTracking,
    color: currentTheme.primary,
    size: 20,
    solid: true,
  },
  {
    id: 3,
    route: StackRoutes.PrayerTimeStack,
    label: Translate(MenuNameLanguageConstants.Dhikr),
    type: Icons.MaterialIcons,
    icon: MenuIconConstants.Dhikr,
    component: Dhikr,
    color: currentTheme.primary,
    size: 20,
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
    size: 20,
    solid: true
  },
];
