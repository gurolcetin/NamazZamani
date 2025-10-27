import {Icons} from '../../components';
import {ThemeType} from '../models';

export const SettingsScreenLanguageIconLeft = (theme: ThemeType) => {
  return {
    name: 'earth-europe',
    type: Icons.FontAwesome6,
    color: theme.white,
    size: 20,
    solid: true
  };
};

export const SettingsScreenLanguageIconRight = (theme: ThemeType) => {
  return {
    name: 'angle-right',
    type: Icons.FontAwesome6,
    color: theme.gray,
    size: 16,
    solid: true,
  };
};

export const SettingsScreenThemeIconLeft = (theme: ThemeType) => {
  return {
    name: 'invert-mode-outline',
    type: Icons.Ionicons,
    color: theme.white,
    size: 20,
    solid: true,
  };
};

export const SettingsScreenCalculateIconLeft = (theme: ThemeType) => {
  return {
    name: 'calculator',
    type: Icons.FontAwesome6,
    color: theme.white,
    size: 20,
    solid: true,
  };
};

export const RadioButtonCheckIcon = (theme: ThemeType) => {
  return {
    name: 'check',
    type: Icons.FontAwesome6,
    color: theme.primary,
    size: 20,
    solid: true,
  };
};

export const ThemeSettingsSunIcon = (theme: ThemeType) => {
  return {
    name: 'sun',
    type: Icons.FontAwesome6,
    color: theme.white,
    size: 20,
    solid: true,
  };
};

export const ThemeSettingsMoonIcon = (theme: ThemeType) => {
  return {
    name: 'moon',
    type: Icons.FontAwesome6,
    color: theme.white,
    size: 20,
    solid: true,
  };
};

export const ThemeSettingsSystemIcon = (theme: ThemeType) => {
  return {
    name: 'gear',
    type: Icons.FontAwesome6,
    color: theme.white,
    size: 20,
    solid: true,
  };
};

export const DhikrRepeatIcon = (theme: ThemeType) => {
  return {
    name: 'repeat',
    type: Icons.FontAwesome6,
    color: theme.textColor,
    size: 15,
    solid: false,
  };
};
