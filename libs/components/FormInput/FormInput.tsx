import React from 'react';
import {View, Text} from 'react-native';
import style from './style';

interface FormInputProps {
  label: string;
  children: React.ReactNode;
}

const FormInput = (props: FormInputProps) => {
  const {label, children} = props;

  return (
    <View style={style.container}>
      <Text style={style.label}>{label}</Text>
      {children}
    </View>
  );
};

export default FormInput;
