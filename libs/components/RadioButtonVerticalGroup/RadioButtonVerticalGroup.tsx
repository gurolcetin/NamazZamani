import React, {useEffect, useState} from 'react';
import {IconProps} from '../Icons/Icons';
import {useTheme} from '../../core/providers';
import TableView from '../TableView/TableView';
import TouchableFloatView from '../TouchableFloatView/TouchableFloatView';
import {RadioButtonCheckIcon} from '../../common/constants';

export interface RadioButtonOption<TKey = string | number> {
  iconProps: IconProps;
  iconBackgroundColor?: string;
  title: string;
  key: TKey;
}

export interface RadioButtonVerticalGroupProps<TKey = string | number> {
  options: RadioButtonOption<TKey>[];
  onSelect: (option: RadioButtonOption<TKey>) => void;
  initialOption: TKey;
}

const RadioButtonVerticalGroup = <
  TKey extends string | number = string | number,
>({
  options,
  onSelect,
  initialOption,
}: RadioButtonVerticalGroupProps<TKey>) => {
  const {currentTheme} = useTheme();
  const [selectedOption, setSelectedOption] = useState<
    RadioButtonOption<TKey>
  >();

  useEffect(() => {
    setSelectedOption(
      options.find(option => option.key === initialOption) || options[0],
    );
  }, [initialOption, options]);

  const handleSelect = (option: RadioButtonOption<TKey>) => {
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
