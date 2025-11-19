import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const BackButton = ({
  onPress,
  backgroundColor,
  iconColor,
}: {
  onPress: () => void;
  backgroundColor: string;
  iconColor: string;
}) => (
  <Pressable
    style={[
      styles.pressable,
      {
        backgroundColor,
      },
    ]}
    onPress={onPress}
  >
    <Ionicons name="chevron-back" size={30} color={iconColor} />
  </Pressable>
);

const styles = StyleSheet.create({
  pressable: {
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
});

export default BackButton;
