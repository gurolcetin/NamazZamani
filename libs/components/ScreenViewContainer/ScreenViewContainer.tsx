import React from 'react';
import {useTheme} from '../../core/providers';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {globalStyle} from '../../styles';

interface ScreenViewContainerProps {
  children: React.ReactNode;
}

const ScreenViewContainer = (props: ScreenViewContainerProps) => {
  const {children} = props;
  const {currentTheme} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        globalStyle.flex1,
        {
          backgroundColor: currentTheme.backgroundColor,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      {children}
    </View>
  );
};

export default ScreenViewContainer;
