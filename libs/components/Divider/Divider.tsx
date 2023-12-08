import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../core/providers';
import {horizontalScale} from '../../core/utils';

const Divider = () => {
  const {currentTheme} = useTheme();

  return (
    <View style={[styles.divider, {backgroundColor: currentTheme.gray}]} />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginVertical: 10,
    marginLeft: horizontalScale(20),
  },
});

export default Divider;
