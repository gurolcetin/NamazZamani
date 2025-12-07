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

  console.log('bannerLoaded', bannerLoaded);

  const dynamicExtraPadding = bannerLoaded
    ? Platform.OS === 'ios'
      ? 20
      : 30
    : Platform.OS === 'ios'
    ? -5
    : 10;

  console.log('dynamicExtraPadding', dynamicExtraPadding);

  const extraBottomSpace = tabBarHeight + dynamicExtraPadding;
  console.log('tabBarHeight', tabBarHeight);
  console.log('extraBottomSpace', extraBottomSpace);

  return <ScreenViewContainer {...props} extraBottomSpace={extraBottomSpace} />;
};

export default BottomTabScreenViewContainer;
