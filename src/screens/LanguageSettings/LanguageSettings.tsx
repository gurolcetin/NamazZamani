import React, {useState} from 'react';
import {View} from 'react-native';
import {globalStyle} from '../../../libs/styles';
import {useTheme} from '../../../libs/core/providers';
import {Icons, RadioButtonVerticalGroup} from '../../../libs/components';
import {useTranslation} from 'react-i18next';

const LanguageSettings = ({navigation}) => {
  const {currentTheme} = useTheme();
  const {i18n, t} = useTranslation();
  const [initialOption, setInitialOption] = useState<string>('tr');

  const setThemeAndClose = selectedOptions => {
    console.log('selectedOptions', selectedOptions);
    i18n.changeLanguage(selectedOptions.key);
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
        title: t('settings.Turkish'),
        key: 'tr',
      },
      {
        iconProps: {
          name: 'moon',
          type: Icons.FontAwesome6,
          color: currentTheme.primary,
          size: 20,
          solid: true,
        },
        title: t('settings.English'),
        key: 'en',
      },
    ],
  };

  return (
    // Object.keys(i18n.options.resources as Resource).map(lang => () => {
    //     console.log('lang', lang);

    //     }
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

export default LanguageSettings;
