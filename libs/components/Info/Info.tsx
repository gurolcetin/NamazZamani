import React from 'react';
import {TouchableOpacity, ViewStyle} from 'react-native';
import Icon, {Icons} from '../Icons/Icons';
import {useTheme} from '../../core/providers';

interface InfoProps {
  styleTouchableOpacity?: ViewStyle;
  infoText: string;
}

const Info = ({styleTouchableOpacity, infoText}: InfoProps) => {
  const {currentTheme} = useTheme();
  return (
    <TouchableOpacity
      style={[styleTouchableOpacity]}
      onPress={() => {
        // alert(infoText);
      }}>
      <Icon
        type={Icons.Ionicons}
        name="information-circle-outline"
        color={currentTheme.infoIconColor}
        size={25}
      />
    </TouchableOpacity>
  );
};

export default Info;
