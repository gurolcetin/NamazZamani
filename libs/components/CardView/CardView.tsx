import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from '../../core/providers';
import {style} from './style';
import {horizontalScale} from '../../core/utils';

interface CardViewProps {
  children: React.ReactNode;
  title?: string;
  paddingLeft?: number;
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
            paddingLeft: props.paddingLeft || horizontalScale(20),
          },
        ]}>
        {props.children}
      </View>
    </View>
  );
};

export default CardView;
