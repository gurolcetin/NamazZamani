import React from 'react';
import {Text, View} from 'react-native';
import {globalStyle} from '../../../libs/styles';
import {useTheme} from '../../../libs/core/providers';

const PrayerTime = () => {
  const {currentTheme} = useTheme();
  return (
    <View
      style={[
        globalStyle.flex1,
        {backgroundColor: currentTheme.backgroundColor},
      ]}>
      <Text>Prayer Time</Text>
    </View>
  );
};

export default PrayerTime;
