import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useTheme} from '../../core/providers';
import style from './style';

interface RadioButtonListProps {
  radioButtonList: RadioButtonProps[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  selectedItemBackgroundColor?: string;
  selectedItemTextColor?: string;
}

interface RadioButtonProps {
  value: string;
  label: string;
}

const RadioButton = (props: RadioButtonListProps) => {
  const {currentTheme} = useTheme();

  const onPress = (value: string) => {
    props.onValueChange(value);
  };

  return (
    <>
      <View style={style.container}>
        {props.radioButtonList.map((item, index) => {
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onPress(item.value)}
              style={[
                style.button,
                {
                  borderColor: currentTheme.primary,
                  backgroundColor:
                    props.selectedValue === item.value
                      ? currentTheme.primary
                      : currentTheme.white,
                },
              ]}>
              <Text
                style={{
                  color:
                    props.selectedValue === item.value
                      ? currentTheme.white
                      : currentTheme.black,
                }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
};

export default RadioButton;
