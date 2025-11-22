import React, { useEffect, useMemo, useState } from 'react';
import { Authenticated } from './MainNavigation';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../../libs/core/providers';
import { Theme } from '../../libs/common/enums';
import BootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import { RootRoutes } from './Routes';

const RootStack = createNativeStackNavigator();
const ONBOARDING_KEY = 'onboarded';

const RootNavigation = () => {
  const { theme, currentTheme } = useTheme();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasOnboarded(stored === 'true');
      } catch {
        setHasOnboarded(false);
      }
    })();
  }, []);

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

  if (hasOnboarded === null) {
    return null;
  }

  return (
    <NavigationContainer
      theme={navigationTheme}
      onReady={() => {
        BootSplash.hide();
      }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!hasOnboarded && (
          <RootStack.Screen name={RootRoutes.Onboarding}>
            {props => (
              <OnboardingScreen
                {...props}
                onFinish={() => {
                  setHasOnboarded(true);
                }}
              />
            )}
          </RootStack.Screen>
        )}
        <RootStack.Screen name={RootRoutes.Main} component={Authenticated} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;
