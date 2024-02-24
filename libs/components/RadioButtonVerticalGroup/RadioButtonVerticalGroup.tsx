import React, {useEffect, useState} from 'react';
import {IconProps} from '../Icons/Icons';
import {useTheme} from '../../core/providers';
import TableView from '../TableView/TableView';
import TouchableFloatView from '../TouchableFloatView/TouchableFloatView';
import {RadioButtonCheckIcon} from '../../common/constants';

interface RadioButtonOption {
  iconProps: IconProps;
  iconBackgroundColor?: string;
  title: string;
  key: string;
}

export interface RadioButtonVerticalGroupProps {
  options: RadioButtonOption[];
  onSelect: () => void;
  initialOption: string;
}

const RadioButtonVerticalGroup = ({options, onSelect, initialOption}: any) => {
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
      dividerMargin={35}
      childrenList={options.map((option, index) => (
        <TouchableFloatView
          key={index}
          onPress={() => {
            handleSelect(option);
          }}
          title={option.title}
          iconLeft={option.iconProps}
          iconLeftBackgroundColor={option.iconBackgroundColor}
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
