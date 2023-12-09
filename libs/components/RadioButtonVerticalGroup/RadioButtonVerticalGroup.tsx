import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {IconProps, Icons} from '../Icons/Icons';
import Icon from '../Icons/Icons';
import {globalStyle} from '../../styles';
import {style} from './style';
import {useTheme} from '../../core/providers';
import Divider from '../Divider/Divider';
import TableView from '../TableView/TableView';
import TouchableFloatView from '../TouchableFloatView/TouchableFloatView';
import {RadioButtonCheckIcon} from '../../common/constants';

interface RadioButtonOption {
  iconProps: IconProps;
  title: string;
  key: string;
}

export interface RadioButtonVerticalGroupProps {
  options: RadioButtonOption[];
  onSelect: () => void;
  initialOption: string;
}

const RadioButtonVerticalGroup = ({options, onSelect, initialOption}) => {
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
    <TableView
      childrenList={options.map((option, index) => (
        <TouchableFloatView
          key={index}
          onPress={() => {
            handleSelect(option);
          }}
          title={option.title}
          iconLeft={option.iconProps}
          iconRight={{
            ...RadioButtonCheckIcon(currentTheme),
            name: selectedOption?.key === option.key ? 'check' : '',
          }}
        />
      ))}
    />
  );
};

export default RadioButtonVerticalGroup;
