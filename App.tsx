import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import RootNavigation from './src/navigation/RootNavigation';
import { ThemeProvider } from './libs/core/providers';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './libs/redux/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
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
import { resetHintRuntimeState } from './libs/redux/reducers/ContextualHints';

LogBox.ignoreLogs(['Sending...']);
enableScreens();

const HintRuntimeBootstrap = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(resetHintRuntimeState());
  }, [dispatch]);

  return null;
};

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
    mobileAds()
      .setRequestConfiguration({
        testDeviceIdentifiers: [
          'EMULATOR', // Android/iOS simülatörler için
          'a8ac00e6ebc87db82a1f53a559e17a2c', // iOS cihaz örneği
        ],
      })
      .then(() => mobileAds().initialize());
  }, []);

  if (!isChecking && !canContinue) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{t('app.unsupportedVersionTitle')}</Text>
        <Text style={styles.message}>{t('app.unsupportedVersionMessage')}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {!isChecking && canContinue ? (
          <Provider store={store}>
            <PersistGate persistor={persistor} loading={null}>
              <HintRuntimeBootstrap />
              <ThemeProvider>
                <RootNavigation />
              </ThemeProvider>
            </PersistGate>
          </Provider>
        ) : (
          <View style={styles.root} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666666',
  },
});
export default App;
