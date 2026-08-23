import { StackRoutes } from '../../../src/navigation/Routes';
import { PrayerTimeStack } from '../../../src/navigation/Stack/PrayerTimeStack';
import { SettingsStack } from '../../../src/navigation/Stack/SettingsStack';
import { ToolsStack } from '../../../src/navigation/Stack/ToolsStack';
import { DebugStack } from '../../../src/navigation/Stack/DebugStack';
import { Icons } from '../../components/Icons/Icons';
import { ThemeType } from '../models';
import { IS_DEV_FEATURES_ENABLED } from './runtime.constants';
import { MenuNameLanguageConstants } from './language.constants';
import { MenuIconConstants } from './string.contants';

export const bottomTabMenuItems = (currentTheme: ThemeType) =>
  [
    {
      id: 1,
      route: StackRoutes.PrayerTimeStack,
      label: MenuNameLanguageConstants.PrayerTime,
      type: Icons.MaterialDesignIcons,
      icon: MenuIconConstants.PrayerTime,
      component: PrayerTimeStack,
      color: currentTheme.primary,
      size: 26,
      solid: true,
      headerShown: false,
      devOnly: false,
    },
    {
      id: 2,
      route: StackRoutes.ToolsStack,
      label: MenuNameLanguageConstants.Tools,
      type: Icons.MaterialDesignIcons,
      icon: MenuIconConstants.Tools,
      component: ToolsStack,
      color: currentTheme.primary,
      size: 26,
      solid: true,
      headerShown: false,
      devOnly: false,
    },
    {
      id: 3,
      route: StackRoutes.SettingsStack,
      label: MenuNameLanguageConstants.Settings,
      type: Icons.MaterialDesignIcons,
      icon: MenuIconConstants.Settings,
      component: SettingsStack,
      color: currentTheme.primary,
      size: 26,
      solid: true,
      headerShown: false,
      devOnly: false,
    },
    {
      id: 4,
      route: StackRoutes.DebugStack,
      label: MenuNameLanguageConstants.Debug,
      type: Icons.MaterialDesignIcons,
      icon: MenuIconConstants.Debug,
      component: DebugStack,
      color: currentTheme.primary,
      size: 26,
      solid: true,
      headerShown: false,
      devOnly: true,
    },
  ].filter(item => !item.devOnly || IS_DEV_FEATURES_ENABLED);
