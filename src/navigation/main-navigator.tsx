import React, { FC, useEffect, useMemo, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Authenticated } from './MainNavigation';
import { SplashScreen } from '../screens/auth/splash-screen';

const Stack = createNativeStackNavigator();

const MainRoutes = {
  Splash: 'MainSplash',
  App: 'MainApp',
} as const;

type MainStackItem = {
  name: string;
  component: any;
  animation?: 'fade' | 'default';
};

const mainStack: MainStackItem[] = [
  {
    name: MainRoutes.Splash,
    component: SplashScreen,
    animation: 'fade',
  },
  {
    name: MainRoutes.App,
    component: Authenticated,
    animation: 'fade',
  },
];

export const MainNavigator: FC = () => {
  const [hasShownSplash, setHasShownSplash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHasShownSplash(false);
    setReady(true);
  }, []);

  const activeStack = useMemo(
    () =>
      hasShownSplash
        ? mainStack.filter(screen => screen.name !== MainRoutes.Splash)
        : mainStack,
    [hasShownSplash],
  );

  if (!ready) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerLargeTitle: false,
      }}
    >
      {activeStack.map(screen => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          options={{ animation: screen.animation }}
        >
          {props =>
            screen.name === MainRoutes.Splash ? (
              <SplashScreen
                {...props}
                nextRoute={MainRoutes.App}
                onComplete={() => setHasShownSplash(true)}
              />
            ) : (
              React.createElement(screen.component, props)
            )
          }
        </Stack.Screen>
      ))}
    </Stack.Navigator>
  );
};
