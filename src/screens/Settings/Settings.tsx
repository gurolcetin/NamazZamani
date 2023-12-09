import React from 'react';
import {ScrollView, TouchableOpacity, View, Text} from 'react-native';
import {globalStyle} from '../../../libs/styles';
import {TableView, TouchableFloatView} from '../../../libs/components';
import {useTranslation} from 'react-i18next';
import {Resource} from 'i18next';
import {
  SettingsScreenLanguageIconLeft,
  SettingsScreenLanguageIconRight,
  SettingsScreenThemeIconLeft,
} from '../../../libs/common/constants';
import {Routes} from '../../navigation/Routes';
import {useTheme} from '../../../libs/core/providers';

const Settings = ({navigation}) => {
  const {currentTheme} = useTheme();
  const {i18n, t} = useTranslation();

  return (
    <View
      style={[
        globalStyle.flex1,
        {backgroundColor: currentTheme.backgroundColor},
      ]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TableView
          childrenList={[
            <TouchableFloatView
              onPress={() => {
                navigation.navigate(Routes.LanguageSettings);
              }}
              title={t('settings.LanguageSettings')}
              iconLeft={SettingsScreenLanguageIconLeft(currentTheme)}
              iconLeftBackgroundColor={currentTheme.languageIconBackgroundColor}
              iconRight={SettingsScreenLanguageIconRight(currentTheme)}
            />,
            <TouchableFloatView
              onPress={() => {
                navigation.navigate(Routes.ThemeSettings);
              }}
              title={t('settings.ThemeSettings')}
              iconLeft={SettingsScreenThemeIconLeft(currentTheme)}
              iconLeftBackgroundColor={currentTheme.black}
              iconRight={SettingsScreenLanguageIconRight(currentTheme)}
            />,
          ]}
        />
      </ScrollView>
    </View>
  );
};

export default Settings;
