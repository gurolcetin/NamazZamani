import ReactNativeHapticFeedback, { HapticOptions } from 'react-native-haptic-feedback';

export const hapticFeedback = (type: any, options?: HapticOptions | undefined) => {
  ReactNativeHapticFeedback.trigger(type, options);
};
