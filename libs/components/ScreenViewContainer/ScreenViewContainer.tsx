// ScreenViewContainer.tsx
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/providers';
import { globalStyle } from '../../styles';

export interface ScreenViewContainerProps {
  children: React.ReactNode;
  disableBottomPadding?: boolean;
  skeletonContent?: React.ReactNode;
  showSkeleton?: boolean;
  extraBottomSpace?: number;
}

const ScreenViewContainer = ({
  children,
  disableBottomPadding = false,
  skeletonContent = <></>,
  showSkeleton = false,
  extraBottomSpace,
}: ScreenViewContainerProps) => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();

  // Bottom tab olmayan yerlerde kullanılacak default değerler:
  const baseExtraBottomSpace =
    extraBottomSpace ?? (Platform.OS === 'ios' ? 70 : 80);

  const bottomPadding = disableBottomPadding
    ? 0
    : insets.bottom + baseExtraBottomSpace;

  const getSkeletonContent = () => {
    if (skeletonContent) {
      return skeletonContent;
    }
    return (
      <View
        style={{
          ...globalStyle.flex1,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <ActivityIndicator size="large" color={currentTheme.textColor} />
      </View>
    );
  };

  return (
    <View
      style={[
        globalStyle.flex1,
        {
          backgroundColor: currentTheme.backgroundColor,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {!showSkeleton ? children : getSkeletonContent()}
    </View>
  );
};

export default ScreenViewContainer;
