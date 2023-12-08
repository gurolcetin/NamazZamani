import React from 'react';
import {View} from 'react-native';
import {useTheme} from '../../core/providers';
import {style} from './style';

interface CardViewProps {
  children: React.ReactNode;
}

const CardView = (props: CardViewProps) => {
  const {currentTheme} = useTheme();
  return (
    <View
      style={[
        style.container,
        {
          backgroundColor: currentTheme.cardViewBackgroundColor,
          borderBottomColor: currentTheme.cardViewBorderColor,
        },
      ]}>
      {props.children}
    </View>
  );
};

export default CardView;
