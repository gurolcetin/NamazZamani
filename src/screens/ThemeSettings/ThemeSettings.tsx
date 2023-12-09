import React, {useEffect, useState} from 'react';
import {Icons, RadioButtonVerticalGroup} from '../../../libs/components';
import {useTheme} from '../../../libs/core/providers';
import {updateApplicationTheme} from '../../../libs/redux/reducers/ApplicationTheme';
import {useDispatch, useSelector} from 'react-redux';
import {Theme} from '../../../libs/common/enums';
import {useTranslation} from 'react-i18next';
import {View} from 'react-native';
import {globalStyle} from '../../../libs/styles';

const ThemeSettings = () => {
  const dispatch = useDispatch();
  const {currentTheme, toggleTheme} = useTheme();
  const {t} = useTranslation();
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
          size: 20,
          solid: true,
        },
        title: t('settings.Light'),
        key: Theme.LIGHT,
      },
      {
        iconProps: {
          name: 'moon',
          type: Icons.FontAwesome6,
          color: currentTheme.primary,
          size: 20,
          solid: true,
        },
        title: t('settings.Dark'),
        key: Theme.DARK,
      },
      {
        iconProps: {
          name: 'gear',
          type: Icons.FontAwesome6,
          color: currentTheme.primary,
          size: 20,
          solid: true,
        },
        title: t('settings.SystemDefault'),
        key: Theme.SYSTEM,
      },
    ],
  };

  return (
    <View
      style={[
        globalStyle.flex1,
        {backgroundColor: currentTheme.backgroundColor},
      ]}>
      <RadioButtonVerticalGroup
        onSelect={setThemeAndClose}
        options={options.options}
        initialOption={initialOption}
      />
    </View>
  );
};

export default ThemeSettings;
