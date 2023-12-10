import React from 'react';
import {ScrollView, View} from 'react-native';
import {globalStyle} from '../../../libs/styles';
import {TableView, TouchableFloatView} from '../../../libs/components';
import {
  SettingsConstants,
  SettingsScreenLanguageIconLeft,
  SettingsScreenLanguageIconRight,
  SettingsScreenThemeIconLeft,
} from '../../../libs/common/constants';
import {Routes} from '../../navigation/Routes';
import {useTheme} from '../../../libs/core/providers';
import {Translate} from '../../../libs/core/helpers';

const Settings = ({navigation}) => {
  const {currentTheme} = useTheme();

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
              title={Translate(SettingsConstants.LanguageSettings)}
              iconLeft={SettingsScreenLanguageIconLeft(currentTheme)}
              iconLeftBackgroundColor={currentTheme.languageIconBackgroundColor}
              iconRight={SettingsScreenLanguageIconRight(currentTheme)}
            />,
            <TouchableFloatView
              onPress={() => {
                navigation.navigate(Routes.ThemeSettings);
              }}
              title={Translate(SettingsConstants.ThemeSettings)}
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
