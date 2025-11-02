import React from 'react';
import { View, Text } from 'react-native';
import { Icon, Icons } from '../Icons/Icons';
import { useTheme } from '../../core/providers';
import style from './style';

interface FormErrorProps {
  message?: string;
}

const FormError = ({ message }: FormErrorProps) => {
  const { currentTheme } = useTheme();

  return (
    <View style={style.container}>
      <Icon
        type={Icons.FontAwesome6}
        name="exclamation"
        color={currentTheme.formErrorColor}
        size={15}
        solid
      />
      <Text
        style={[
          style.errorMessage,
          {
            color: currentTheme.formErrorColor,
          },
        ]}
      >
        {message !== undefined && message}
      </Text>
    </View>
  );
};

export default FormError;
