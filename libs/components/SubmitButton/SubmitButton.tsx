import React from 'react';
import {TouchableOpacity, View, Text, StyleProp, ViewStyle} from 'react-native';
import style from './style';
import {useTheme} from '../../core/providers';

interface SubmitButtonProps {
  onSubmit: () => void;
  label: string;
  backgroundColor?: string;
  marginHorizontal?: number;
  marginTop?: number;
  buttonStyle?: StyleProp<ViewStyle> | undefined;
}

const SubmitButton = ({
  onSubmit,
  label,
  backgroundColor,
  marginHorizontal,
  marginTop,
  buttonStyle,
}: SubmitButtonProps) => {
  const {currentTheme} = useTheme();
  return (
    <View
      style={[
        style.container,
        {
          marginHorizontal: marginHorizontal ?? 0,
          marginTop: marginTop ?? 0,
        },
        buttonStyle,
      ]}>
      <TouchableOpacity
        style={[
          style.touchableOpacity,
          {
            backgroundColor: backgroundColor ?? currentTheme.primary,
          },
        ]}
        onPress={onSubmit}>
        <Text
          style={[
            style.label,
            {
              color: currentTheme.white,
            },
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SubmitButton;
