import React from 'react';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/providers';
import { globalStyle } from '../../styles';
import { StatusBarBarStyle, Theme } from '../../common/enums';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeAreaWithStatusBarProps {
  children: React.ReactNode;
}

export const SafeAreaWithStatusBar = (props: SafeAreaWithStatusBarProps) => {
  const { children } = props;
  const { theme, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      {/* Üst Safe Area */}
      <SafeAreaView
        style={[
          globalStyle.flex1,
          {
            backgroundColor: currentTheme.statusBarColor,
          },
        ]}
        edges={['top']} // Sadece top safe area
      >
        <StatusBar
          barStyle={
            theme === Theme.DARK
              ? StatusBarBarStyle.LightContent
              : StatusBarBarStyle.DarkContent
          }
          backgroundColor={currentTheme.statusBarColor}
        />
        {children}
      </SafeAreaView>

      {/* Alt Safe Area (custom renk verilebilir) */}
      <View
        style={{
          height: insets.bottom,
          backgroundColor: currentTheme.cardViewBackgroundColor, // istediğin renk
        }}
      />
    </>
  );
};
