import React, {useEffect, useRef} from 'react';
import {View, Animated} from 'react-native';
import Svg, {Circle, Text} from 'react-native-svg';
import { useTheme } from '../../core/providers';

const CircleProgressBar = ({progress}) => {
  const {currentTheme} = useTheme();
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2); // Circumference değerini doğru şekilde hesapla
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress / 100,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const animatedStrokeDashoffset = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View>
      <Svg width={radius * 2} height={radius * 2}>
        <Circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          fill="none"
          stroke="#ccc"
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          fill="none"
          stroke={currentTheme.systemGreen}
          strokeWidth={strokeWidth}
          strokeDasharray={[circumference, circumference]} // strokeDasharray değerini düzelt
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${radius},${radius}`}
        />
        <Text
          x={radius}
          y={radius}
          textAnchor="middle"
          stroke="black"
          fontSize="16">
          {`${Math.round(progress)}%`}
        </Text>
      </Svg>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default CircleProgressBar;
