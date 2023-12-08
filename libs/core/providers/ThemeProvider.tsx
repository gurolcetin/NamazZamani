// ThemeProvider.js
import React, {createContext, useState, useContext, useEffect} from 'react';
import {Theme} from '../../common/enums';
import {useColorScheme} from 'react-native';
import {ThemeType} from '../../common/models';
import {darkTheme, lightTheme} from '../../common/constants';
import {SafeAreaWithStatusBar} from '../../components';
import {updateApplicationTheme} from '../../redux/reducers/ApplicationTheme';
import {useDispatch, useSelector} from 'react-redux';

const ThemeContext = createContext(
  {} as {
    theme: Theme;
    toggleTheme: (theme: Theme) => void;
    currentTheme: ThemeType;
  },
);

const ThemeProvider = ({children}) => {
  const dispatch = useDispatch();
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const isDarkMode = useColorScheme() === Theme.DARK;
  const colorScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(lightTheme);
  const applicationTheme = useSelector((state: any) => state.applicationTheme);

  useEffect(() => {
    if (theme === Theme.DARK) {
      setCurrentTheme(darkTheme);
    } else {
      setCurrentTheme(lightTheme);
    }
  }, [theme]);

  useEffect(() => {
    let storedTheme = applicationTheme.theme;
    // AsyncStorage'den kaydedilen temayı al
    if (storedTheme) {
      if (storedTheme === Theme.SYSTEM) {
        // Eğer kaydedilen tema sistem teması ise, sistem temasını al
        storedTheme = isDarkMode ? Theme.DARK : Theme.LIGHT;
      }
      setTheme(storedTheme as Theme);
    }
  }, []);

  useEffect(() => {
    if (colorScheme) {
      // Sistem teması değiştiğinde, sistem temasını al
      let storedTheme = applicationTheme.theme;
      // AsyncStorage'den kaydedilen temayı al
      if (storedTheme) {
        if (storedTheme === Theme.SYSTEM) {
          // Eğer kaydedilen tema sistem teması ise, sistem temasını al
          storedTheme = isDarkMode ? Theme.DARK : Theme.LIGHT;
          setTheme(storedTheme as Theme);
        }
      }
    }
  }, [colorScheme]);

  const toggleTheme = (newTheme: Theme) => {
    if (newTheme === Theme.SYSTEM) {
      // Eğer kaydedilen tema sistem teması ise, sistem temasını al
      newTheme = isDarkMode ? Theme.DARK : Theme.LIGHT;
    }
    // AsyncStorage'e seçilen temayı kaydet
    dispatch(updateApplicationTheme(newTheme));
    setTheme(newTheme);
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
