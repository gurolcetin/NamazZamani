import { ThemeType } from '../models';
import { Accent } from '../enums';

export const baseLightTheme: ThemeType = {
  primary: '#1bb89d',
  backgroundColor: '#f3f7ff',
  statusBarColor: '#f3f7ff',
  menuBackgroundColor: '#FFFFFF',
  menuBorderColor: '#CCCCCC',
  cardViewBackgroundColor: '#FFFFFF',
  cardViewBorderColor: '#006667',
  textColor: '#000000',
  black: '#000',
  white: 'white',
  gray: '#CCCCCC',
  languageIconBackgroundColor: '#007AFF',
  activeTabTextColor: '#FFFFFF',
  passiveTabTextColor: '#9EAAB6',
  inputBackgroundColor: 'rgba(118, 118, 128, 0.12)',
  inputColor: 'rgba(60, 60, 67, 0.6)',
  segmentedControlTextColor: '#000000',
  segmentedControlBackgroundColor: 'rgba(118, 118, 128, 0.12)',
  segmentedControlSelectedBackgroundColor: '#FFFFFF',
  formErrorColor: '#FF3B30',
  systemGreen: '#31C859',
  systemRed: '#FF382B',
  infoIconColor: '#007AFF',
  calculateIconColor: '#FF9500',
  systemBlue: '#0A84FF',
  shadowColor: '#000',
  placeholderTextColor: '#85858A',
  bottomTabBorderTopColor: '#EBEBEB',
  ramadanCountdown: {
    base: '#F4D03F',
    badgeBorder: 'rgba(255,255,255,0.5)',
    badgeBackground: 'rgba(255,255,255,0.18)',
    labelColor: '#FEF9C3',
    timerBackground: 'rgba(15,23,42,0.2)',
    timerText: '#FFFFFF',
    timerCriticalText: '#FFE4E6',
  },
};

export const baseDarkTheme: ThemeType = {
  primary: '#7BA697',
  backgroundColor: '#000000',
  statusBarColor: '#000000',
  menuBackgroundColor: '#1C1C1E',
  menuBorderColor: '#333333',
  cardViewBackgroundColor: '#1C1C1E',
  cardViewBorderColor: '#7BA697',
  textColor: '#FFFFFF',
  black: '#000',
  white: 'white',
  gray: '#CCCCCC',
  languageIconBackgroundColor: '#007AFF',
  activeTabTextColor: '#FFFFFF',
  passiveTabTextColor: '#9EAAB6',
  inputBackgroundColor: 'rgba(118, 118, 128, 0.24)',
  inputColor: 'rgba(235, 235, 245, 0.6)',
  segmentedControlTextColor: '#FFFFFF',
  segmentedControlBackgroundColor: '#313136',
  segmentedControlSelectedBackgroundColor: '#69696F',
  formErrorColor: '#FF453A',
  systemGreen: '#2DD257',
  systemRed: '#FE4336',
  infoIconColor: '#0A84FF',
  calculateIconColor: '#FF9500',
  systemBlue: '#0A84FF',
  shadowColor: '#000',
  placeholderTextColor: '#9E9EA6',
  bottomTabBorderTopColor: '#242424',
  ramadanCountdown: {
    base: '#D4AC0D', // Light #F4D03F'ün daha koyu, kontrastı yüksek versiyonu
    badgeBorder: 'rgba(255,255,255,0.25)',
    badgeBackground: 'rgba(255,255,255,0.08)',
    labelColor: '#FFF7A3', // Light’taki FE F9 C3'ün daha soluk/dim bir karşılığı
    timerBackground: 'rgba(255,255,255,0.08)', // Light'taki slate arka planın dark eşleniği
    timerText: '#FDFDFD',
    timerCriticalText: '#FFB3C0', // Light’taki #FFE4E6’in daha koyu kontrastlı versiyonu
  },
};

export const accentPalettes: Record<
  Accent,
  {
    light: { primary: string; border: string; gradient: [string, string] };
    dark: { primary: string; border: string; gradient: [string, string] };
  }
> = {
  [Accent.TEAL]: {
    light: {
      primary: '#1BB89D',
      border: '#006667',
      gradient: ['#9EE7D6', '#BFD7FF'],
    },
    dark: {
      primary: '#22B59B',
      border: '#78D2C6',
      gradient: ['#0C1015', '#1A1F27'],
    },
  },
  [Accent.PURPLE]: {
    light: {
      primary: '#7B61FF',
      border: '#5B47D6',
      gradient: ['#EDEBFF', '#D9F5FF'],
    },
    dark: {
      primary: '#9B8CFF',
      border: '#B2A7FF',
      gradient: ['#111324', '#1C1E2E'],
    },
  },
  [Accent.EMERALD]: {
    light: {
      primary: '#10B981',
      border: '#047857',
      gradient: ['#E7FFF4', '#EAF4FF'],
    },
    dark: {
      primary: '#34D399',
      border: '#6EE7B7',
      gradient: ['#0C1512', '#151C18'],
    },
  },
  [Accent.BLUE]: {
    light: {
      primary: '#0A84FF',
      border: '#0060CC',
      gradient: ['#E7F1FF', '#EAF7FF'],
    },
    dark: {
      primary: '#5EA2FF',
      border: '#8BB9FF',
      gradient: ['#0B0F1A', '#121A24'],
    },
  },
  [Accent.ORANGE]: {
    light: {
      primary: '#FF7A1A',
      border: '#C25E13',
      gradient: ['#FFF0E6', '#FFF6EA'],
    },
    dark: {
      primary: '#FFA45C',
      border: '#FFC18F',
      gradient: ['#15100C', '#1E1711'],
    },
  },
};
