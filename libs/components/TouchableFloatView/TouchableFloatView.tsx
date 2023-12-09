import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import Icon, {IconProps, Icons} from '../Icons/Icons';
import {globalStyle} from '../../styles';
import {useTheme} from '../../core/providers';
import {useTranslation} from 'react-i18next';
import style from './style';

interface TouchableFloatViewProps {
  onPress: () => void;
  title: string;
  iconLeft: IconProps;
  iconLeftBackgroundColor?: string;
  iconRight: IconProps;
}

const TouchableFloatView = ({
  onPress,
  title,
  iconLeft,
  iconLeftBackgroundColor,
  iconRight,
}: TouchableFloatViewProps) => {
  const {currentTheme} = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={style.touchbaleOpacity}>
      <View style={style.viewContainer}>
        <View
          style={
            (globalStyle.flex025,
            {
              backgroundColor: iconLeftBackgroundColor,
              borderRadius: 5,
              padding: 5,
            })
          }>
          <Icon
            type={iconLeft.type}
            name={iconLeft.name}
            color={iconLeft.color}
            size={iconLeft.size}
            solid={iconLeft.solid}
          />
        </View>
        <View style={[globalStyle.flex075, style.titleViewContainer]}>
          <Text
            style={{
              color: currentTheme.textColor,
            }}>
            {title}
          </Text>
        </View>
      </View>
      <View style={style.iconRightViewContainer}>
        <Icon
          type={iconRight.type}
          name={iconRight.name}
          color={iconRight.color}
          size={iconRight.size}
          solid={iconRight.solid}
        />
      </View>
    </TouchableOpacity>
  );
};

export default TouchableFloatView;
