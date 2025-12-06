import React, {
  PropsWithChildren,
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
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

type ThemeProviderProps = PropsWithChildren<{}>;

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const systemDark = colorScheme === 'dark';

  // mode
  const [theme, setTheme] = useState<Theme>(
    systemDark ? Theme.DARK : Theme.LIGHT,
  );
  // accent
  const [accent, setAccentState] = useState<Accent>(Accent.TEAL);

  // Redux state (opsiyonel)
  const applicationTheme = useSelector((state: any) => state.applicationTheme);

  const resolveTheme = useCallback(
    (selection: Theme) => {
      if (selection === Theme.SYSTEM) {
        return systemDark ? Theme.DARK : Theme.LIGHT;
      }
      return selection;
    },
    [systemDark],
  );

  // Persisted load
  useEffect(() => {
    (async () => {
      try {
        let storedPreference =
          applicationTheme?.preference ??
          ((await AsyncStorage.getItem(THEME_KEY)) as Theme | null) ??
          Theme.SYSTEM;
        const storedAccent =
          ((await AsyncStorage.getItem(ACCENT_KEY)) as Accent | null) ??
          Accent.TEAL;

        const resolvedTheme = resolveTheme(storedPreference as Theme);
        setTheme(resolvedTheme);
        setAccentState(storedAccent as Accent);
        if (
          applicationTheme?.theme !== resolvedTheme ||
          applicationTheme?.preference !== storedPreference
        ) {
          dispatch(
            updateApplicationTheme({
              preference: storedPreference as Theme,
              theme: resolvedTheme,
            }),
          );
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sistem değişirse SYSTEM seçeneği aktifken güncelle
  useEffect(() => {
    if (
      (applicationTheme?.preference ?? Theme.SYSTEM) === Theme.SYSTEM
    ) {
      const resolved = resolveTheme(Theme.SYSTEM);
      setTheme(resolved);
      if (applicationTheme?.theme !== resolved) {
        dispatch(
          updateApplicationTheme({
            preference: Theme.SYSTEM,
            theme: resolved,
          }),
        );
      }
    }
  }, [
    applicationTheme?.preference,
    applicationTheme?.theme,
    colorScheme,
    dispatch,
    resolveTheme,
  ]);

  const toggleTheme = async (newTheme: Theme) => {
    const resolved = resolveTheme(newTheme);
    setTheme(resolved);
    dispatch(
      updateApplicationTheme({
        preference: newTheme,
        theme: resolved,
      }),
    );
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
