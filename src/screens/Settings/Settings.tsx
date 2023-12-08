import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {Theme} from '../../../libs/common/enums';
import {useTheme} from '../../../libs/core/providers';
import {globalStyle} from '../../../libs/styles';
import {
  CardView,
  Icons,
  RadioButtonVerticalGroup,
} from '../../../libs/components';
import {useDispatch, useSelector} from 'react-redux';
import {updateApplicationTheme} from '../../../libs/redux/reducers/ApplicationTheme';

const Settings = () => {
  const dispatch = useDispatch();
  const {toggleTheme, currentTheme} = useTheme();
  const [initialOption, setInitialOption] = useState<string>(Theme.SYSTEM);
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  useEffect(() => {
    setInitialOption(applicationTheme.theme);
  }, []);

  const setThemeAndClose = selectedOptions => {
    toggleTheme(selectedOptions.key);
    dispatch(updateApplicationTheme(selectedOptions.key));
  };

  const options = {
    options: [
      {
        iconProps: {
          name: 'sun',
          type: Icons.FontAwesome6,
          color: currentTheme.primary,
          size: 30,
          solid: true,
        },
        title: 'Light',
        key: Theme.LIGHT,
      },
      {
        iconProps: {
          name: 'moon',
          type: Icons.FontAwesome6,
          color: currentTheme.primary,
          size: 30,
          solid: true,
        },
        title: 'Dark',
        key: Theme.DARK,
      },
      {
        iconProps: {
          name: 'gear',
          type: Icons.FontAwesome6,
          color: currentTheme.primary,
          size: 30,
          solid: true,
        },
        title: 'System Default',
        key: Theme.SYSTEM,
      },
    ],
    iconPropsRadioButton: {
      name: 'check',
      type: Icons.FontAwesome6,
      color: currentTheme.primary,
      size: 20,
      solid: true,
    },
  };

  return (
    <View
      style={[
        globalStyle.flex1,
        {backgroundColor: currentTheme.backgroundColor},
      ]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <CardView title="Theme Settings">
          <RadioButtonVerticalGroup
            onSelect={setThemeAndClose}
            options={options.options}
            iconPropsRadioButton={options.iconPropsRadioButton}
            initialOption={initialOption}
          />
        </CardView>
      </ScrollView>
    </View>
  );
};

export default Settings;
