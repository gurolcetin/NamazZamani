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
import { enableScreens } from 'react-native-screens';

const App = () => {
  LogBox.ignoreLogs(['Sending...']);
  enableScreens();
  const [isChecking, setIsChecking] = useState(true);
  const [canContinue, setCanContinue] = useState(true);

  useEffect(() => {
    const runCheck = async () => {
      const ok = await checkForceUpdate();
      setCanContinue(ok);
      setIsChecking(false);
    };

    runCheck();
  }, []);
  if (isChecking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Versiyon kontrol ediliyor...</Text>
      </View>
    );
  }

  if (!canContinue) {
    // Eski sürümdeyse ve update zorunluysa,
    // kullanıcı alert sonrası da buraya dönse bile
    // ana içeriği göstermeyebilirsin
    return (
      <View style={styles.center}>
        <Text>Bu sürüm artık desteklenmiyor.</Text>
        <Text>Lütfen uygulamayı güncelleyin.</Text>
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
