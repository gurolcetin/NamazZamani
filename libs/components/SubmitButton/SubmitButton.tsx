import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import style from './style';
import {useTheme} from '../../core/providers';

interface SubmitButtonProps {
  onSubmit: () => void;
  label: string;
  backgroundColor?: string;
  marginHorizontal?: number;
  marginTop?: number;
}

const SubmitButton = ({
  onSubmit,
  label,
  backgroundColor,
  marginHorizontal,
  marginTop,
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
