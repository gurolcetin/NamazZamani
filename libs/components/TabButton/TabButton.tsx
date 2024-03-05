import React, {useEffect, useRef} from 'react';
import {Animated, TouchableOpacity} from 'react-native';
import Icon from '../Icons/Icons';
import style from './style';
import {useTheme} from '../../core/providers';
import {HapticFeedbackMethods} from '../../common/constants';
import { hapticFeedback } from '../../core/helpers';

const TabButton = ({item, accessibilityState, onPress}: any) => {
  const {currentTheme} = useTheme();

  const animatedValues = {
    translate: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0)).current,
  };

  const {translate, scale} = animatedValues;

  useEffect(() => {
    handleAnimated();
  }, [accessibilityState.selected]);

  const handleAnimated = () => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: accessibilityState.selected ? 1 : 0,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(scale, {
        toValue: accessibilityState.selected ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const translateStyles = {
    transform: [
      {
        translateY: translate.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const scaleStyles = {
    opacity: scale.interpolate({
      inputRange: [0.5, 1],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        scale: scale,
      },
    ],
  };

  return (
    <TouchableOpacity
      onPress={() => {
        onPress();
        hapticFeedback(HapticFeedbackMethods.ImpactLight);
      }}
      style={style.container}>
      <Animated.View
        style={[
          style.button,
          translateStyles,
          {borderColor: currentTheme.menuBackgroundColor},
        ]}>
        <Animated.View
          style={[
            style.animatedView,
            scaleStyles,
            {backgroundColor: item.color},
          ]}
        />
        <Icon
          type={item.type}
          name={item.icon}
          color={accessibilityState.selected ? currentTheme.white : item.color}
          style={item.icon}
          size={item.size}
          solid={item.solid}
        />
      </Animated.View>
      <Animated.Text style={[style.title, {opacity: scale, color: item.color}]}>
        {item.label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

export default TabButton;
