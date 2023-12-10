import React, {useEffect, useState} from 'react';
import {Image} from 'react-native';
import {globalStyle} from '../../../libs/styles';
import {useTheme} from '../../../libs/core/providers';
import {Icons, RadioButtonVerticalGroup} from '../../../libs/components';
import {useTranslation} from 'react-i18next';
import {ScrollView} from 'react-native-gesture-handler';
import style from './style';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AsyncStorageConstants,
  LanguagePrefix,
  LanguageSettingsConstants,
} from '../../../libs/common/constants';
import {Translate} from '../../../libs/core/helpers';

const LanguageSettings = ({navigation}) => {
  const {currentTheme} = useTheme();
  const {i18n} = useTranslation();
  const [initialOption, setInitialOption] = useState<string>(LanguagePrefix.tr);

  useEffect(() => {
    AsyncStorage.getItem(AsyncStorageConstants.LanguageKey)
      .then(language => {
        if (language) {
          return setInitialOption(language);
        }
        return setInitialOption(LanguagePrefix.tr);
      })
      .catch(e => {
        return setInitialOption(LanguagePrefix.tr);
      });
  }, []);

  const setThemeAndClose = selectedOptions => {
    AsyncStorage.getItem(AsyncStorageConstants.LanguageKey)
      .then(language => {
        if (language && language !== selectedOptions.key) {
          i18n.changeLanguage(selectedOptions.key);
          return setInitialOption(language);
        }
      })
      .catch(e => {});
  };

  const options = {
    options: [
      {
        iconProps: {
          type: Icons.Image,
          image: (
            <Image
              source={require('../../../assets/images/flags/turkey.png')}
              style={style.image}
            />
          ),
        },
        title: Translate(LanguageSettingsConstants.Turkish),
        key: 'tr',
      },
      {
        iconProps: {
          type: Icons.Image,
          image: (
            <Image
              source={require('../../../assets/images/flags/united-kingdom.png')}
              style={style.image}
            />
          ),
        },
        title: Translate(LanguageSettingsConstants.English),
        key: 'en',
      },
    ],
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[
        globalStyle.flex1,
        {backgroundColor: currentTheme.backgroundColor},
      ]}>
      <RadioButtonVerticalGroup
        onSelect={setThemeAndClose}
        options={options.options}
        initialOption={initialOption}
      />
    </ScrollView>
  );
};

export default LanguageSettings;
