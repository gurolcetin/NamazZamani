import React from 'react';
import {StatusBar} from 'react-native';
import {useTheme} from '../../core/providers';
import {globalStyle} from '../../styles';
import {StatusBarBarStyle, Theme} from '../../common/enums';
import {SafeAreaView} from 'react-native-safe-area-context';

interface SafeAreaWithStatusBarProps {
  children: React.ReactNode;
}

export const SafeAreaWithStatusBar = (props: SafeAreaWithStatusBarProps) => {
  const {children} = props;
  const {theme, currentTheme} = useTheme();

  return (
    <SafeAreaView
      style={[
        globalStyle.flex1,
        {
          backgroundColor: currentTheme.statusBarColor,
        },
      ]}
      edges={['top', 'bottom']}>
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
  );
};
