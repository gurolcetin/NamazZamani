import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import styles from './style';
import {useTheme} from '../../core/providers';

export interface InputSpinnerProps {
  value: number;
  inceaseValue: (value: number) => void;
  decreaseValue: (value: number) => void;
}

const InputSpinner = ({
  value,
  inceaseValue,
  decreaseValue,
}: InputSpinnerProps) => {
  const {currentTheme} = useTheme();

  return (
    <View>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            if (value > 0) {
              decreaseValue(value - 1);
            }
          }}
          style={[
            styles.increaseDecreaseButton,
            {backgroundColor: currentTheme.systemGreen},
          ]}>
          <Text
            style={[
              styles.increaseDecreaseButtonText,
              {color: currentTheme.white},
            ]}>
            -
          </Text>
        </TouchableOpacity>
        <Text style={[styles.valueText, {color: currentTheme.textColor}]}>
          {value}
        </Text>
        <TouchableOpacity
          onPress={() => {
            inceaseValue(value + 1);
          }}
          style={[
            styles.increaseDecreaseButton,
            {backgroundColor: currentTheme.systemRed},
          ]}>
          <Text
            style={[
              styles.increaseDecreaseButtonText,
              {color: currentTheme.white},
            ]}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InputSpinner;
