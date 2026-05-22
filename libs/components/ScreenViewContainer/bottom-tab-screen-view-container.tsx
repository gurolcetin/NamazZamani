// TabScreenViewContainer.tsx
import React from 'react';
import { Platform } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenViewContainer, {
  ScreenViewContainerProps,
} from './ScreenViewContainer';
import { useBanner } from '../../core/providers';

const BottomTabScreenViewContainer = (props: ScreenViewContainerProps) => {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { bannerLoaded, bottomOverlayHeight } = useBanner();

  const fallbackDynamicPadding = bannerLoaded
    ? Platform.OS === 'ios'
      ? 56
      : 70
    : Platform.OS === 'ios'
    ? 10
    : 20;

  const measuredOverlayWithoutInset =
    bottomOverlayHeight > 0
      ? Math.max(bottomOverlayHeight - insets.bottom, 0)
      : 0;

  const fallbackOverlayWithoutInset = tabBarHeight + fallbackDynamicPadding;

  const extraBottomSpace =
    measuredOverlayWithoutInset > 0
      ? measuredOverlayWithoutInset
      : fallbackOverlayWithoutInset;

  return <ScreenViewContainer {...props} extraBottomSpace={extraBottomSpace} />;
};

export default BottomTabScreenViewContainer;
