import React, { useMemo } from 'react';
import { Authenticated } from './MainNavigation';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { useTheme } from '../../libs/core/providers';
import { Theme } from '../../libs/common/enums';
import BootSplash from 'react-native-bootsplash';

const RootNavigation = () => {
  //   const user = useSelector(state => state.user);
  //   return user.isLoggedIn ? <Authenticated /> : <NonAuthenticated />;
  const { theme, currentTheme } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = theme === Theme.DARK ? DarkTheme : DefaultTheme;

    return {
      ...base,
      colors: {
        ...base.colors,
        background: currentTheme.backgroundColor,
        card: currentTheme.cardViewBackgroundColor,
        primary: currentTheme.primary,
        text: currentTheme.textColor,
        border: currentTheme.menuBorderColor,
      },
    };
  }, [currentTheme, theme]);
  return (
    <NavigationContainer
      theme={navigationTheme}
      onReady={() => {
        BootSplash.hide();
      }}
    >
      <Authenticated />
    </NavigationContainer>
  );
};

export default RootNavigation;
