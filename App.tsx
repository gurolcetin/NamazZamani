import React from 'react';
import BootSplash from 'react-native-bootsplash';
import {NavigationContainer} from '@react-navigation/native';
import 'react-native-gesture-handler';
import RootNavigation from './src/navigation/RootNavigation';

const App = () => {
  return (
    <NavigationContainer
      onReady={() => {
        BootSplash.hide();
      }}>
      <RootNavigation />
    </NavigationContainer>
  );
};

export default App;
