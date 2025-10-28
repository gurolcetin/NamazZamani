import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Theme, Accent } from '../../common/enums';
import { ThemeType } from '../../common/models';
import {
  updateApplicationTheme /*, updateAccent*/,
} from '../../redux/reducers/ApplicationTheme';
import {
  baseDarkTheme,
  baseLightTheme,
  accentPalettes,
} from '../../common/constants/Colors';

type Ctx = {
  theme: Theme;
  accent: Accent;
  toggleTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
  currentTheme: ThemeType;
  gradient: [string, string]; // arka plan
};

const ThemeContext = createContext({} as Ctx);

const THEME_KEY = 'app_theme_mode';
const ACCENT_KEY = 'app_theme_accent';

export const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const systemDark = useColorScheme() === 'dark';
  const colorScheme = useColorScheme();

  // mode
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  // accent
  const [accent, setAccentState] = useState<Accent>(Accent.TEAL);

  // Redux state (opsiyonel)
  const applicationTheme = useSelector((state: any) => state.applicationTheme);

  // Persisted load
  useEffect(() => {
    (async () => {
      try {
        let storedTheme =
          applicationTheme?.theme ??
          ((await AsyncStorage.getItem(THEME_KEY)) as Theme | null);
        const storedAccent =
          ((await AsyncStorage.getItem(ACCENT_KEY)) as Accent | null) ??
          Accent.TEAL;

        if (storedTheme === Theme.SYSTEM) {
          storedTheme = systemDark ? Theme.DARK : Theme.LIGHT;
        }
        setTheme(
          (storedTheme as Theme) || (systemDark ? Theme.DARK : Theme.LIGHT),
        );
        setAccentState(storedAccent as Accent);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sistem değişirse SYSTEM seçeneği aktifken güncelle
  useEffect(() => {
    if (applicationTheme?.theme === Theme.SYSTEM) {
      setTheme(systemDark ? Theme.DARK : Theme.LIGHT);
    }
  }, [colorScheme]);

  const toggleTheme = async (newTheme: Theme) => {
    if (newTheme === Theme.SYSTEM) {
      newTheme = systemDark ? Theme.DARK : Theme.LIGHT;
    }
    setTheme(newTheme);
    dispatch(updateApplicationTheme(newTheme));
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  };

  const setAccent = async (a: Accent) => {
    setAccentState(a);
    // dispatch(updateAccent(a))
    await AsyncStorage.setItem(ACCENT_KEY, a);
  };

  // === Theme merge ===
  const base = theme === Theme.DARK ? baseDarkTheme : baseLightTheme;
  const acc = accentPalettes[accent][theme === Theme.DARK ? 'dark' : 'light'];

  const currentTheme: ThemeType = {
    ...base,
    primary: acc.primary,
    cardViewBorderColor: acc.border,
  };

  const gradient: [string, string] = acc.gradient;

  return (
    <ThemeContext.Provider
      value={{ theme, accent, toggleTheme, setAccent, currentTheme, gradient }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
