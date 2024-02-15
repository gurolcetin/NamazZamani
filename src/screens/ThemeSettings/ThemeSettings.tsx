import React, {useEffect, useState} from 'react';
import {
  RadioButtonVerticalGroup,
  ScreenViewContainer,
} from '../../../libs/components';
import {useTheme} from '../../../libs/core/providers';
import {updateApplicationTheme} from '../../../libs/redux/reducers/ApplicationTheme';
import {useDispatch, useSelector} from 'react-redux';
import {Theme} from '../../../libs/common/enums';
import {ScrollView} from 'react-native';
import {
  ThemeSettingsConstants,
  ThemeSettingsMoonIcon,
  ThemeSettingsSunIcon,
  ThemeSettingsSystemIcon,
} from '../../../libs/common/constants';
import {Translate} from '../../../libs/core/helpers';

const ThemeSettings = () => {
  const dispatch = useDispatch();
  const {currentTheme, toggleTheme} = useTheme();
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
        iconProps: ThemeSettingsSunIcon(currentTheme),
        title: Translate(ThemeSettingsConstants.Light),
        key: Theme.LIGHT,
        iconBackgroundColor: '#FDD835',
      },
      {
        iconProps: ThemeSettingsMoonIcon(currentTheme),
        title: Translate(ThemeSettingsConstants.Dark),
        key: Theme.DARK,
        iconBackgroundColor: '#333333',
      },
      {
        iconProps: ThemeSettingsSystemIcon(currentTheme),
        title: Translate(ThemeSettingsConstants.SystemDefault),
        key: Theme.SYSTEM,
        iconBackgroundColor: currentTheme.gray,
      },
    ],
  };

  return (
    <ScreenViewContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <RadioButtonVerticalGroup
          onSelect={setThemeAndClose}
          options={options.options}
          initialOption={initialOption}
        />
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default ThemeSettings;
