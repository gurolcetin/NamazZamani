import React from 'react';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

import { Image, StyleProp, ViewStyle } from 'react-native';
import { scaleFontSize } from '../../core/utils';

export const Icons = {
  Ionicons,
  FontAwesome6,
  Image,
  MaterialDesignIcons,
};
export interface IconProps {
  type: any;
  name?: string;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle> | undefined;
  solid?: boolean;
  image?: React.ReactNode;
}

export const Icon = ({
  type,
  name,
  color,
  size,
  style,
  solid = false,
  image,
}: IconProps) => {
  const fontSize = scaleFontSize(24);
  const Tag = type;
  return (
    <>
      {type &&
        (type === Icons.Image
          ? image
          : name && (
              <Tag
                name={name}
                size={size || fontSize}
                color={color}
                style={style}
                iconStyle={solid ? 'solid' : 'regular'}
              />
            ))}
    </>
  );
};
