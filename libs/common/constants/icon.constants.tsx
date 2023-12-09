import {Icons} from '../../components';
import {ThemeType} from '../models';

const SettingsScreenLanguageIconLeft = (theme: ThemeType) => {
  return {
    name: 'earth',
    type: Icons.AntDesign,
    color: theme.white,
    size: 20,
    solid: true,
  };
};

const SettingsScreenLanguageIconRight = (theme: ThemeType) => {
  return {
    name: 'angle-right',
    type: Icons.FontAwesome6,
    color: theme.gray,
    size: 16,
    solid: true,
  };
};

const SettingsScreenThemeIconLeft = (theme: ThemeType) => {
  return {
    name: 'theme-light-dark',
    type: Icons.MaterialCommunityIcons,
    color: theme.white,
    size: 20,
    solid: true,
  };
};

const RadioButtonCheckIcon = (theme: ThemeType) => {
  return {
    name: 'check',
    type: Icons.FontAwesome6,
    color: theme.primary,
    size: 20,
    solid: true,
  };
};

export {
  SettingsScreenLanguageIconLeft,
  SettingsScreenLanguageIconRight,
  SettingsScreenThemeIconLeft,
  RadioButtonCheckIcon,
};
