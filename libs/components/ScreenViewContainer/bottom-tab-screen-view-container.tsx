// TabScreenViewContainer.tsx
import React from 'react';
import { Platform } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import ScreenViewContainer, {
  ScreenViewContainerProps,
} from './ScreenViewContainer';
import { useBanner } from '../../core/providers';

const BottomTabScreenViewContainer = (props: ScreenViewContainerProps) => {
  const tabBarHeight = useBottomTabBarHeight();
  const { bannerLoaded } = useBanner();

  const dynamicExtraPadding = bannerLoaded
    ? Platform.OS === 'ios'
      ? 20
      : 30
    : Platform.OS === 'ios'
    ? -5
    : 10;

  const extraBottomSpace = tabBarHeight + dynamicExtraPadding;

  return <ScreenViewContainer {...props} extraBottomSpace={extraBottomSpace} />;
};

export default BottomTabScreenViewContainer;
