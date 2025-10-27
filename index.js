/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import './i18n';
import { LogBox } from 'react-native';

// Bu hata mesajı versiyon uyumsuzlukları ile alakalı olduğu için bu hata görmezden gelindi.
LogBox.ignoreLogs([
  'RCTBridge required dispatch_sync to load RCTAccessibilityManager. This may lead to deadlocks',
]);
AppRegistry.registerComponent(appName, () => App);
