import React from 'react';
import {View, Text} from 'react-native';
import Icon, {Icons} from '../Icons/Icons';
import {useTheme} from '../../core/providers';
import style from './style';

interface FormErrorProps {
  requiredMessage?: string;
}

const FormError = ({requiredMessage}: FormErrorProps) => {
  const {currentTheme} = useTheme();

  return (
    <View style={style.container}>
      <Icon
        type={Icons.AntDesign}
        name="exclamationcircleo"
        color={currentTheme.formErrorColor}
        size={15}
      />
      <Text
        style={[
          style.errorMessage,
          {
            color: currentTheme.formErrorColor,
          },
        ]}>
        {requiredMessage !== undefined && requiredMessage}
      </Text>
    </View>
  );
};

export default FormError;
