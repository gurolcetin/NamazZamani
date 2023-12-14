import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../core/providers';
import {horizontalScale} from '../../core/utils';

interface DividerProps {
  marginLeft?: number;
}

const Divider = (props: DividerProps) => {
  const {currentTheme} = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: currentTheme.gray,
          marginLeft: horizontalScale(props.marginLeft) || 0,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 0.5,
  },
});

export default Divider;
