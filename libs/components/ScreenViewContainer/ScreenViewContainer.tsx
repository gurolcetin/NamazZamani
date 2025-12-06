import React from 'react';
import { useTheme } from '../../core/providers';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyle } from '../../styles';

interface ScreenViewContainerProps {
  children: React.ReactNode;
  disableBottomPadding?: boolean;
  skeletonContent?: React.ReactNode;
  showSkeleton?: boolean;
}

const ScreenViewContainer = ({
  children,
  disableBottomPadding = false,
  skeletonContent = <></>,
  showSkeleton = false,
}: ScreenViewContainerProps) => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const defaultExtraBottomSpace = Platform.OS === 'ios' ? 40 : 50;
  const bottomPadding = disableBottomPadding
    ? 0
    : insets.bottom + defaultExtraBottomSpace;
  const getSkeletonContent = () => {
    if (skeletonContent) {
      return skeletonContent;
    }
    return (
      <View
        style={
          (globalStyle.flex1,
          {
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          })
        }
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
