import {StackRoutes} from '../../../src/navigation/Routes';
import {PrayerTimeStack} from '../../../src/navigation/Stack/PrayerTimeStack';
import {SettingsStack} from '../../../src/navigation/Stack/SettingsStack';
import MissedPrayer from '../../../src/screens/MissedPrayer/MissedPrayer';
import {Icons} from '../../components/Icons/Icons';
import {Translate} from '../../core/helpers';
import {MenuNameLanguageConstants} from './language.constants';
import {MenuIconConstants} from './string.contants';

export const bottomTabMenuItems = currentTheme => [
  {
    id: 1,
    route: StackRoutes.PrayerTimeStack,
    label: Translate(MenuNameLanguageConstants.PrayerTime),
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.PrayerTime,
    component: PrayerTimeStack,
    color: currentTheme.primary,
    size: 20,
  },
  {
    id: 2,
    route: StackRoutes.PrayerTimeStack,
    label: Translate(MenuNameLanguageConstants.MissedPrayer),
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.MissedPrayer,
    component: MissedPrayer,
    color: currentTheme.primary,
    solid: true,
  },
  {
    id: 3,
    route: StackRoutes.PrayerTimeStack,
    label: Translate(MenuNameLanguageConstants.Settings),
    type: Icons.FontAwesome6,
    icon: MenuIconConstants.Settings,
    component: SettingsStack,
    color: currentTheme.primary,
  },
];
