import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import style from './style';
import {useTheme} from '../../core/providers';

interface SubmitButtonProps {
  onSubmit: () => void;
  label: string;
}

const SubmitButton = ({onSubmit, label}: SubmitButtonProps) => {
  const {currentTheme} = useTheme();
  return (
    <View style={style.container}>
      <TouchableOpacity
        style={[
          style.touchableOpacity,
          {
            backgroundColor: currentTheme.primary,
          },
        ]}
        onPress={onSubmit}>
        <Text
          style={{
            color: currentTheme.white,
          }}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SubmitButton;
