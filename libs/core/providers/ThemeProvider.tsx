// ThemeProvider.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useState, useContext, useEffect} from 'react';
import {Theme} from '../../common/enums';
import {SafeAreaView, StatusBar, useColorScheme} from 'react-native';
import {ThemeType} from '../../common/models';
import {darkTheme, lightTheme} from '../../common/constants';
import {globalStyle} from '../../styles';
import {SafeAreaWithStatusBar} from '../../components';

const ThemeContext = createContext(
  {} as {
    theme: Theme;
    toggleTheme: (theme: Theme) => void;
    currentTheme: ThemeType;
  },
);

const ThemeProvider = ({children}) => {
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const isDarkMode = useColorScheme() === Theme.DARK;
  const colorScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(lightTheme);

  useEffect(() => {
    if (theme === Theme.DARK) {
      setCurrentTheme(darkTheme);
    } else {
      setCurrentTheme(lightTheme);
    }
  }, [theme]);

  useEffect(() => {
    console.log('useEffect');
    AsyncStorage.getItem('theme').then(storedTheme => {
      // AsyncStorage'den kaydedilen temayı al
      if (storedTheme) {
        if (storedTheme === Theme.SYSTEM) {
          // Eğer kaydedilen tema sistem teması ise, sistem temasını al
          storedTheme = isDarkMode ? Theme.DARK : Theme.LIGHT;
        }
        setTheme(storedTheme as Theme);
      }
    });
  }, []);

  useEffect(() => {
    if (colorScheme) {
      // Sistem teması değiştiğinde, sistem temasını al
      const newTheme = colorScheme === Theme.DARK ? Theme.DARK : Theme.LIGHT;
      setTheme(newTheme);
    }
  }, [colorScheme]);

  const toggleTheme = (newTheme: Theme) => {
    if (newTheme === Theme.SYSTEM) {
      // Eğer kaydedilen tema sistem teması ise, sistem temasını al
      newTheme = isDarkMode ? Theme.DARK : Theme.LIGHT;
    }
    setTheme(newTheme);
    // AsyncStorage'e seçilen temayı kaydet
    AsyncStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{theme, toggleTheme, currentTheme}}>
      <SafeAreaWithStatusBar>{children}</SafeAreaWithStatusBar>
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  return useContext(ThemeContext);
};

export {ThemeProvider, useTheme};
