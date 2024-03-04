import React from 'react';
import {ScrollView} from 'react-native';
import {
  ScreenViewContainer,
  TableView,
  TouchableFloatView,
} from '../../../libs/components';
import {
  SettingsConstants,
  SettingsScreenCalculateIconLeft,
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
    <ScreenViewContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TableView
          dividerMargin={35}
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
            <TouchableFloatView
              onPress={() => {
                navigation.navigate(Routes.CalculateSettings);
              }}
              title={Translate(SettingsConstants.CalculateSettings)}
              iconLeft={SettingsScreenCalculateIconLeft(currentTheme)}
              iconLeftBackgroundColor={currentTheme.calculateIconColor}
              iconRight={SettingsScreenLanguageIconRight(currentTheme)}
            />,
          ]}
        />
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default Settings;
