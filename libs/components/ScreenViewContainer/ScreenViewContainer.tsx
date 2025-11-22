import React from 'react';
import { useTheme } from '../../core/providers';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyle } from '../../styles';
import { SafeAreaWithStatusBar } from '../SafeAreaWithStatusBar/SafeAreaWithStatusBar';

interface ScreenViewContainerProps {
  children: React.ReactNode;
  hasBottomMenu?: boolean; // default true olacak
}

const ScreenViewContainer = ({
  children,
  hasBottomMenu = true, // <-- DEFAULT DEĞER
}: ScreenViewContainerProps) => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaWithStatusBar>
      <View
        style={[
          globalStyle.flex1,
          {
            backgroundColor: currentTheme.backgroundColor,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: hasBottomMenu
              ? Platform.OS === 'ios'
                ? insets.bottom + 40
                : insets.bottom + 50
              : 0,
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaWithStatusBar>
  );
};

export default ScreenViewContainer;
