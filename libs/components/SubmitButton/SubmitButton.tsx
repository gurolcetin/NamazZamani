import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import style from './style';
import {useTheme} from '../../core/providers';

interface SubmitButtonProps {
  onSubmit: () => void;
  label: string;
  backgroundColor?: string;
}

const SubmitButton = ({
  onSubmit,
  label,
  backgroundColor,
}: SubmitButtonProps) => {
  const {currentTheme} = useTheme();
  return (
    <View style={style.container}>
      <TouchableOpacity
        style={[
          style.touchableOpacity,
          {
            backgroundColor: backgroundColor || currentTheme.primary,
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
