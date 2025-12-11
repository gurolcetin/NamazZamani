import React, { useMemo } from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../core/providers';
import { style } from './style';
import { useSelector } from 'react-redux';
import { FontScaleOption } from '../../common/enums';
import { getFontScaleMultiplier } from '../../core/helpers';

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
  const { currentTheme } = useTheme();
  const applicationSettings = useSelector(
    (state: any) => state.applicationSettings,
  );

  const fontScalePreference =
    applicationSettings?.fontScale ?? FontScaleOption.MEDIUM;
  const fontScaleMultiplier = useMemo(
    () => getFontScaleMultiplier(fontScalePreference),
    [fontScalePreference],
  );

  return (
    <View style={style.container}>
      {props.title && (
        <Text
          style={[
            style.title,
            { color: currentTheme.primary, fontSize: 16 * fontScaleMultiplier },
          ]}
        >
          {props.title}
        </Text>
      )}
      <View
        style={[
          style.cardContainer,
          {
            backgroundColor: currentTheme.cardViewBackgroundColor,
            borderBottomColor: currentTheme.cardViewBorderColor,
            paddingLeft: props.paddingLeft ?? 20,
            shadowColor: currentTheme.shadowColor,
          },
          props.cardStyle,
          props.shadow && style.shadow,
        ]}
      >
        {props.children}
      </View>
      {props.bottomDescription && (
        <Text
          style={[
            props.bottomDescriptionStyle,
            { fontSize: 14 * fontScaleMultiplier },
          ]}
        >
          {props.bottomDescription}
        </Text>
      )}
    </View>
  );
};

export default CardView;
