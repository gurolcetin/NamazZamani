import React from 'react';
import BootSplash from 'react-native-bootsplash';
import {NavigationContainer} from '@react-navigation/native';
import 'react-native-gesture-handler';
import RootNavigation from './src/navigation/RootNavigation';
import {ThemeProvider} from './libs/core/providers';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import store, {persistor} from './libs/redux/store';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {LogBox} from 'react-native';
const App = () => {
  LogBox.ignoreLogs(['Sending...']);
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <ThemeProvider>
            <NavigationContainer
              onReady={() => {
                BootSplash.hide();
              }}>
              <RootNavigation />
            </NavigationContainer>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;
