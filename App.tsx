import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import RootNavigation from './src/navigation/RootNavigation';
import { ThemeProvider } from './libs/core/providers';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './libs/redux/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  LogBox,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { checkForceUpdate } from './libs/core/helpers/update-checker';
import { prayerNotificationManager } from './libs/core/helpers/prayer-notification';
import { enableScreens } from 'react-native-screens';
import { useTranslation } from 'react-i18next';
import mobileAds from 'react-native-google-mobile-ads';

LogBox.ignoreLogs(['Sending...']);
enableScreens();

const App = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [canContinue, setCanContinue] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const runCheck = async () => {
      const ok = await checkForceUpdate();
      setCanContinue(ok);
      setIsChecking(false);
    };

    runCheck();
  }, []);

  useEffect(() => {
    prayerNotificationManager.initialize();
  }, []);

  useEffect(() => {
    mobileAds().initialize();
  }, []);

  if (isChecking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>{t('app.checkingVersion')}</Text>
      </View>
    );
  }

  if (!canContinue) {
    // Eski sürümdeyse ve update zorunluysa,
    // kullanıcı alert sonrası da buraya dönse bile
    // ana içeriği göstermeyebilirsin
    return (
      <View style={styles.center}>
        <Text>{t('app.unsupportedVersionTitle')}</Text>
        <Text>{t('app.unsupportedVersionMessage')}</Text>
      </View>
    );
  }
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate persistor={persistor} loading={null}>
            <ThemeProvider>
              <RootNavigation />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default App;
