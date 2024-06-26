import React from 'react';
import {View, Text, StyleProp, ViewStyle} from 'react-native';
import {useTheme} from '../../core/providers';
import {style} from './style';
import {horizontalScale} from '../../core/utils';

export interface CardViewProps {
  children: React.ReactNode;
  title?: string;
  paddingLeft?: number;
  bottomDescription?: string;
  bottomDescriptionStyle?: any;
  cardStyle?: StyleProp<ViewStyle> | undefined;
  shadow?: boolean;
}

const CardView = (props: CardViewProps) => {
  const {currentTheme} = useTheme();

  return (
    <View style={style.container}>
      {props.title && (
        <Text style={[style.title, {color: currentTheme.primary}]}>
          {props.title}
        </Text>
      )}
      <View
        style={[
          style.cardContainer,
          {
            backgroundColor: currentTheme.cardViewBackgroundColor,
            borderBottomColor: currentTheme.cardViewBorderColor,
            paddingLeft: props.paddingLeft ?? horizontalScale(20),
            shadowColor: currentTheme.shadowColor,
          },
          props.cardStyle,
          props.shadow && style.shadow,
        ]}>
        {props.children}
      </View>
      {props.bottomDescription && (
        <Text style={props.bottomDescriptionStyle}>
          {props.bottomDescription}
        </Text>
      )}
    </View>
  );
};

export default CardView;
