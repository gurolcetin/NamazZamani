import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { Routes } from '../../navigation/Routes';
import { useTheme } from '../../../libs/core/providers';
import { Translate } from '../../../libs/core/helpers';
import { Accent } from '../../../libs/common/enums';

const Settings = ({ navigation }) => {
  const { currentTheme, accent, setAccent } = useTheme();

  const options = [
    Accent.TEAL,
    Accent.PURPLE,
    Accent.EMERALD,
    Accent.BLUE,
    Accent.ORANGE,
  ];

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
            <View>
              {options.map(a => (
                <Pressable
                  key={a}
                  onPress={() => setAccent(a)}
                  style={[styles2.dot, accent === a && styles2.dotActive]}
                >
                  <Text style={{ fontSize: 12, color: '#fff' }}>
                    {a[0].toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>,
          ]}
        />
      </ScrollView>
    </ScreenViewContainer>
  );
};
const styles2 = StyleSheet.create({
  row:{flexDirection:'row', gap:10, padding:12},
  dot:{width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center', backgroundColor:'#666'},
  dotActive:{transform:[{scale:1.05}], borderWidth:2, borderColor:'#fff'},
});

export default Settings;
