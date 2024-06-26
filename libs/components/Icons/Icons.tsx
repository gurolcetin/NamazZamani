import React, {useEffect} from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Foundation from 'react-native-vector-icons/Foundation';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import {Image, StyleProp, ViewStyle} from 'react-native';
import {scaleFontSize} from '../../core/utils';

export const Icons = {
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
  Feather,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  AntDesign,
  Entypo,
  SimpleLineIcons,
  Octicons,
  Foundation,
  EvilIcons,
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
                solid={solid}
              />
            ))}
    </>
  );
};

export default Icon;
