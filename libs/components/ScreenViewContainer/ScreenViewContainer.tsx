import React from 'react';
import { useTheme } from '../../core/providers';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyle } from '../../styles';

interface ScreenViewContainerProps {
  children: React.ReactNode;
  disableBottomPadding?: boolean;
}

const ScreenViewContainer = ({
  children,
  disableBottomPadding = false,
}: ScreenViewContainerProps) => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const defaultExtraBottomSpace = Platform.OS === 'ios' ? 40 : 50;
  const bottomPadding = disableBottomPadding
    ? 0
    : insets.bottom + defaultExtraBottomSpace;

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
      {children}
    </View>
  );
};

export default ScreenViewContainer;
