import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import style from './style';
import { useTheme } from '../../core/providers';
import { useSelector } from 'react-redux';
import { FontScaleOption } from '../../common/enums';
import { getFontScaleMultiplier } from '../../core/helpers';

interface SubmitButtonProps {
  onSubmit: () => void;
  label: string;
  backgroundColor?: string;
  marginHorizontal?: number;
  marginTop?: number;
  buttonStyle?: StyleProp<ViewStyle> | undefined;
  fontSize?: number;
}

const SubmitButton = ({
  onSubmit,
  label,
  backgroundColor,
  marginHorizontal,
  marginTop,
  buttonStyle,
}: SubmitButtonProps) => {
  const { currentTheme } = useTheme();
  const applicationSettings = useSelector(
    (state: any) => state.applicationSettings,
  );

  const fontScalePreference =
    applicationSettings?.fontScale ?? FontScaleOption.MEDIUM;
  const fontScaleMultiplier = useMemo(
    () => getFontScaleMultiplier(fontScalePreference),
    [fontScalePreference],
  );
  return (
    <View
      style={[
        style.container,
        {
          marginHorizontal: marginHorizontal ?? 0,
          marginTop: marginTop ?? 0,
        },
        buttonStyle,
      ]}
    >
      <TouchableOpacity
        style={[
          style.touchableOpacity,
          {
            backgroundColor: backgroundColor ?? currentTheme.primary,
          },
        ]}
        onPress={onSubmit}
      >
        <Text
          style={[
            style.label,
            {
              color: currentTheme.white,
              fontSize: 16 * fontScaleMultiplier,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SubmitButton;
