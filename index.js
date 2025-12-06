/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import './i18n';
import App from './App';
import { name as appName } from './app.json';
import { LogBox } from 'react-native';

// Bu hata mesajı versiyon uyumsuzlukları ile alakalı olduğu için bu hata görmezden gelindi.
LogBox.ignoreLogs([
  'RCTBridge required dispatch_sync to load RCTAccessibilityManager. This may lead to deadlocks',
]);
AppRegistry.registerComponent(appName, () => App);
