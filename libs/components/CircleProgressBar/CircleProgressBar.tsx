import React, {useEffect, useRef, useState} from 'react';
import {Animated, View, Text as NativeText} from 'react-native';
import Svg, {Circle, Text} from 'react-native-svg';
import {useTheme} from '../../core/providers';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import {DhikrRepeatIcon, HapticFeedbackMethods} from '../../common/constants';
import {hapticFeedback} from '../../core/helpers';
import Icon from '../Icons/Icons';

interface CircleProgressBarProps {
  progress: number;
  size: number;
  count: number;
  maxCount: number;
  description?: string;
  isCyclical?: boolean;
  incraseValue: (value: number) => void;
}

const CircleProgressBar = ({
  progress,
  size,
  count,
  maxCount,
  description,
  isCyclical = false,
  incraseValue,
}: CircleProgressBarProps) => {
  const {currentTheme} = useTheme();
  const radius = size;
  const strokeWidth = radius / 7;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [textDimensions, setTextDimensions] = useState({width: 0, height: 0});

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const animatedStrokeDashoffset = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const getCyclicalCount = () => {
    if (count < maxCount) return 0;
    let currentCount = count;
    let division = (currentCount - (currentCount % maxCount)) / maxCount;
    return count % maxCount == 0 ? division - 1 : division;
  };
  const getCount = () => {
    if (count <= maxCount || !isCyclical) return count;
    let currentCount = count;
    return currentCount % maxCount == 0 ? maxCount : count % maxCount;
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (count >= maxCount && !isCyclical) {
          hapticFeedback(HapticFeedbackMethods.NotificationError);
        } else {
          incraseValue(count + 1);
          if (count % maxCount === maxCount - 1) {
            hapticFeedback(HapticFeedbackMethods.NotificationSuccess);
          } else {
            hapticFeedback(HapticFeedbackMethods.Soft);
          }
        }
      }}>
      <Svg width={radius * 2} height={radius * 2}>
        <Circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          fill="none"
          stroke={currentTheme.segmentedControlBackgroundColor}
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
          onLayout={event => {
            const {width, height} = event.nativeEvent.layout;
            setTextDimensions({width, height});
          }}
          x={radius}
          y={textDimensions.height / 2 + radius - 10}
          textAnchor="middle"
          stroke={currentTheme.textColor}
          fontSize={radius / 3}>
          {getCount()}
        </Text>
        {description && (
          <Text
            x={radius}
            y={radius + 20}
            textAnchor="middle"
            stroke={currentTheme.textColor}
            fontSize="12"
            fontWeight={'200'}>
            {description}
          </Text>
        )}
      </Svg>
      {isCyclical && (
        <View
          style={{
            position: 'absolute',
            top: radius + 30,
            left: radius - 17,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon {...DhikrRepeatIcon(currentTheme)} />
          <NativeText
            style={{
              marginLeft: 5,
              alignSelf: 'center',
              textAlign: 'center',
              fontSize: 20,
              color: currentTheme.textColor,
            }}>
            {getCyclicalCount()}
          </NativeText>
        </View>
      )}
    </TouchableWithoutFeedback>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default CircleProgressBar;
