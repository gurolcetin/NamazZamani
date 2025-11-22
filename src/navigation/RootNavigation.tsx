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
import PrivacyScreen, { PRIVACY_KEY } from '../screens/Privacy/PrivacyScreen';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaWithStatusBar } from '../../libs/components';

const RootStack = createNativeStackNavigator();
const ONBOARDING_KEY = 'onboarded';

const RootNavigation = () => {
  const { theme, currentTheme } = useTheme();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState<boolean | null>(
    null,
  );
  const [isCheckingPrivacy, setIsCheckingPrivacy] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [[, storedPrivacy], [, storedOnboarding]] =
          await AsyncStorage.multiGet([PRIVACY_KEY, ONBOARDING_KEY]);
        setHasAcceptedPrivacy(storedPrivacy === 'true');
        setHasOnboarded(storedOnboarding === 'true');
      } catch {
        setHasAcceptedPrivacy(false);
        setHasOnboarded(false);
      } finally {
        setIsCheckingPrivacy(false);
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

  if (
    isCheckingPrivacy ||
    hasAcceptedPrivacy === null ||
    hasOnboarded === null
  ) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={currentTheme?.primary} />
      </View>
    );
  }

  const initialRouteName = !hasAcceptedPrivacy
    ? RootRoutes.Privacy
    : !hasOnboarded
    ? RootRoutes.Onboarding
    : RootRoutes.Main;

  return (
    <NavigationContainer
      theme={navigationTheme}
      onReady={() => {
        BootSplash.hide();
      }}
    >
      <SafeAreaWithStatusBar>
        <RootStack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRouteName}
        >
          {!hasAcceptedPrivacy && (
            <RootStack.Screen name={RootRoutes.Privacy}>
              {props => (
                <PrivacyScreen
                  {...props}
                  onAccept={() => setHasAcceptedPrivacy(true)}
                  nextRoute={
                    hasOnboarded ? RootRoutes.Main : RootRoutes.Onboarding
                  }
                />
              )}
            </RootStack.Screen>
          )}
          {hasAcceptedPrivacy && !hasOnboarded && (
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
      </SafeAreaWithStatusBar>
    </NavigationContainer>
  );
};

export default RootNavigation;
