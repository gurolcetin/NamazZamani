import { useEffect } from 'react';
import { ThemeType } from '../../common/models';
import { Platform } from 'react-native';

export const useModalOptions = (navigation: any, currentTheme: ThemeType) => {
  useEffect(() => {
    navigation.setOptions({
      presentation: Platform.select({
        ios: 'formSheet',
        android: 'transparentModal',
      }),
      gestureEnabled: true, // Kaydırma jesti aktif
      animation: 'slide_from_bottom', // (iOS + Android) alttan gelme animasyonu
      contentStyle: Platform.select({
        android: { backgroundColor: 'transparent' },
        ios: undefined,
      }),
    });
  }, [navigation, currentTheme]);
};
