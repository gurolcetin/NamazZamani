import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon, Icons } from '../Icons/Icons';

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
    <Icon
      type={Icons.FontAwesome6}
      name="chevron-left"
      size={30}
      color={iconColor}
      solid
    />
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
