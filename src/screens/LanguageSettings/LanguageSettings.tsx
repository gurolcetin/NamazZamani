import React, {useEffect, useState} from 'react';
import {Image} from 'react-native';
import {
  Icons,
  RadioButtonVerticalGroup,
  ScreenViewContainer,
} from '../../../libs/components';
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
  const {i18n} = useTranslation();
  const [initialOption, setInitialOption] = useState<string>(
    LanguagePrefix.TURKISH,
  );

  useEffect(() => {
    AsyncStorage.getItem(AsyncStorageConstants.LanguageKey)
      .then(language => {
        if (language) {
          return setInitialOption(language);
        }
        return setInitialOption(LanguagePrefix.TURKISH);
      })
      .catch(e => {
        return setInitialOption(LanguagePrefix.TURKISH);
      });
  }, []);

  const setLanguageAndClose = selectedOptions => {
    if (selectedOptions.key === initialOption) {
      return;
    }
    i18n.changeLanguage(selectedOptions.key);
    return setInitialOption(selectedOptions.key);
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
        key: LanguagePrefix.TURKISH,
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
        key: LanguagePrefix.ENGLISH,
      },
    ],
  };

  return (
    <ScreenViewContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <RadioButtonVerticalGroup
          onSelect={setLanguageAndClose}
          options={options.options}
          initialOption={initialOption}
        />
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default LanguageSettings;
