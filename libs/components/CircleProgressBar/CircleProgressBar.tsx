import React, {useEffect, useRef} from 'react';
import {Animated} from 'react-native';
import Svg, {Circle, Text} from 'react-native-svg';
import {useTheme} from '../../core/providers';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';

interface CircleProgressBarProps {
  progress: number;
  size: number;
  count: number;
  maxCount: number;
  description?: string;
  incraseValue: (value: number) => void;
}

const CircleProgressBar = ({
  progress,
  size,
  count,
  maxCount,
  description,
  incraseValue,
}: CircleProgressBarProps) => {
  const {currentTheme} = useTheme();
  const radius = size;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
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
    <TouchableWithoutFeedback
      onPress={() => {
        if (count < maxCount) {
          incraseValue(count + 1);
        }
      }}>
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
          strokeDasharray={[circumference, circumference]}
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
          {count}
        </Text>

        {description && (
          <Text
            x={radius}
            y={radius + 15}
            textAnchor="middle"
            stroke="black"
            fontSize="16">
            {description}
          </Text>
        )}
      </Svg>
    </TouchableWithoutFeedback>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default CircleProgressBar;
