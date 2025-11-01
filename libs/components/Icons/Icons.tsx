import React from 'react';
import { AntDesign } from '@react-native-vector-icons/ant-design';
// import { FontAwesome } from '@react-native-vector-icons/fontawesome';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Feather } from '@react-native-vector-icons/feather';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';

import { Image, StyleProp, ViewStyle } from 'react-native';
import { scaleFontSize } from '../../core/utils';

export const Icons = {
  MaterialIcons,
  Ionicons,
  Feather,
  // FontAwesome,
  FontAwesome6,
  AntDesign,
  Image,
};

export interface IconProps {
  type: any;
  name: string;
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle> | undefined;
  solid?: boolean;
  image?: React.ReactNode;
}

const Icon = ({
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

export default Icon;
