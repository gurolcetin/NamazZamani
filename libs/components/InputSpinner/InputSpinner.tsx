import React, { useMemo, useRef } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import styles from './style';
import { useTheme } from '../../core/providers';
import { HapticFeedbackMethods } from '../../common/constants';
import { getFontScaleMultiplier, hapticFeedback } from '../../core/helpers';
import { useSelector } from 'react-redux';
import { FontScaleOption } from '../../common/enums';

export interface InputSpinnerProps {
  value: number;
  inceaseValue: (value: number) => void;
  decreaseValue: (value: number) => void;
}

const InputSpinner = ({
  value,
  inceaseValue,
  decreaseValue,
}: InputSpinnerProps) => {
  const { currentTheme } = useTheme();
  const intervalIdRef = useRef<any>(null); // setInterval id'sini saklamak için useRef kullan
  const intervalRef = useRef(350); // Başlangıç hızını referans olarak sakla

  const startIncreasing = () => {
    if (!intervalIdRef.current) {
      intervalIdRef.current = setInterval(() => {
        inceaseValue(value + 1);
        hapticFeedback(HapticFeedbackMethods.Soft);
      }, intervalRef.current);
    }
  };

  const stopIncreasing = () => {
    clearInterval(intervalIdRef.current);
    intervalIdRef.current = null; // setInterval id'sini temizle
  };

  const startDecreasing = () => {
    if (!intervalIdRef.current) {
      intervalIdRef.current = setInterval(() => {
        decreaseValue(value - 1);
        hapticFeedback(HapticFeedbackMethods.Soft);
      }, intervalRef.current);
    }
  };
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
    <View>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            decreaseValue(value - 1);
            hapticFeedback(HapticFeedbackMethods.Soft);
          }}
          onPressIn={startDecreasing}
          onPressOut={stopIncreasing}
          style={[
            styles.increaseDecreaseButton,
            { backgroundColor: currentTheme.systemGreen },
          ]}
        >
          <Text
            style={[
              styles.increaseDecreaseButtonText,
              {
                color: currentTheme.white,
                fontSize: 16 * (fontScaleMultiplier ?? 1),
              },
            ]}
          >
            -
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.valueText,
            {
              color: currentTheme.textColor,
              fontSize: 16 * (fontScaleMultiplier ?? 1),
            },
          ]}
        >
          {value}
        </Text>
        <TouchableOpacity
          onPress={() => {
            inceaseValue(value + 1);
            hapticFeedback(HapticFeedbackMethods.Soft);
          }}
          onPressIn={startIncreasing}
          onPressOut={stopIncreasing}
          style={[
            styles.increaseDecreaseButton,
            { backgroundColor: currentTheme.systemRed },
          ]}
        >
          <Text
            style={[
              styles.increaseDecreaseButtonText,
              {
                color: currentTheme.white,
                fontSize: 16 * (fontScaleMultiplier ?? 1),
              },
            ]}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InputSpinner;
