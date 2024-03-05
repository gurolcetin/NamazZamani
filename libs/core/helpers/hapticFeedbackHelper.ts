import ReactNativeHapticFeedback, { HapticOptions } from 'react-native-haptic-feedback';

export const hapticFeedback = (type: string, options?: HapticOptions | undefined) => {
  ReactNativeHapticFeedback.trigger(type, options);
};
