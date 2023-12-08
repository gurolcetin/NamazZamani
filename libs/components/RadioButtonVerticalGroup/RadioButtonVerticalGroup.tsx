import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {IconProps} from '../Icons/Icons';
import Icon from '../Icons/Icons';
import {globalStyle} from '../../styles';
import {style} from './style';
import {useTheme} from '../../core/providers';
import Divider from '../Divider/Divider';

interface RadioButtonOption {
  iconProps: IconProps;
  title: string;
  key: string;
}

export interface RadioButtonVerticalGroupProps {
  options: RadioButtonOption[];
  iconPropsRadioButton: IconProps;
  onSelect: () => void;
  initialOption: string;
}

const RadioButtonVerticalGroup = ({
  options,
  iconPropsRadioButton,
  onSelect,
  initialOption,
}) => {
  const {currentTheme} = useTheme();
  const [selectedOption, setSelectedOption] = useState<RadioButtonOption>();

  useEffect(() => {
    setSelectedOption(
      options.find(option => option.key === initialOption) || options[0],
    );
  }, [initialOption]);

  const handleSelect = option => {
    setSelectedOption(option);
    onSelect(option);
  };

  return (
    <View>
      {options.map((option, index) => (
        <View key={'container' + index}>
          <TouchableOpacity
            onPress={() => handleSelect(option)}
            key={index}
            style={style.container}>
            <View style={style.leftContainer}>
              <View style={globalStyle.flex025}>
                <Icon
                  type={option.iconProps.type}
                  name={option.iconProps.name}
                  color={option.iconProps.color}
                  size={option.iconProps.size}
                  solid={option.iconProps.solid}
                />
              </View>
              <View style={globalStyle.flex075}>
                <Text
                  style={{
                    color: currentTheme.textColor,
                  }}>
                  {option.title}
                </Text>
              </View>
            </View>
            <Icon
              type={iconPropsRadioButton.type}
              color={iconPropsRadioButton.color}
              size={iconPropsRadioButton.size}
              name={
                selectedOption?.key === option.key ? 'circle-check' : 'circle'
              }
              solid={selectedOption?.key === option.key}
            />
          </TouchableOpacity>
          {index !== options.length - 1 && <Divider />}
        </View>
      ))}
    </View>
  );
};

export default RadioButtonVerticalGroup;
