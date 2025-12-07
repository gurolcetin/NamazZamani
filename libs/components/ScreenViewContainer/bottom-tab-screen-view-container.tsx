// TabScreenViewContainer.tsx
import React from 'react';
import { Platform } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import ScreenViewContainer, {
  ScreenViewContainerProps,
} from './ScreenViewContainer';

const BottomTabScreenViewContainer = (props: ScreenViewContainerProps) => {
  const tabBarHeight = useBottomTabBarHeight();
  console.log('tabBarHeight', tabBarHeight);
  const extraBottomSpace = tabBarHeight + (Platform.OS === 'ios' ? 20 : 30);
  console.log('extraBottomSpace', extraBottomSpace);

  return <ScreenViewContainer {...props} extraBottomSpace={extraBottomSpace} />;
};

export default BottomTabScreenViewContainer;
