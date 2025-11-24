import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text as NativeText,
  Pressable,
} from 'react-native';
import Svg, { Circle, Text } from 'react-native-svg';
import { useTheme } from '../../core/providers';
import { HapticFeedbackMethods } from '../../common/constants';
import { Icon, Icons } from '../Icons/Icons';
import { hapticFeedback } from '../../core/helpers';

interface CircleProgressBarProps {
  progress: number;
  size: number;
  count: number;
  maxCount: number;
  description?: string;
  isCyclical?: boolean;
  incraseValue: (value: number) => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircleProgressBar = ({
  progress,
  size,
  count,
  maxCount,
  description,
  isCyclical = false,
  incraseValue,
}: CircleProgressBarProps) => {
  const { currentTheme } = useTheme();

  const radius = size;
  const strokeWidth = radius / 7;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);

  // Bu component için tek ana renk: önce systemGreen, yoksa primary
  const baseColor =
    (currentTheme.systemGreen as string) || (currentTheme.primary as string);

  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pressAnimation = useRef(new Animated.Value(0)).current;

  const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [progress, progressAnimation, circumference]);

  const animatedStrokeDashoffset = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const scale = pressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });

  // transparent yerine aynı rengin 0 ve 0.1 alpha halleri
  const backgroundColor = pressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [hexToRgba(baseColor, 0), hexToRgba(baseColor, 0.1)],
  });

  const handlePressIn = () => {
    Animated.spring(pressAnimation, {
      toValue: 1,
      useNativeDriver: false, // backgroundColor için JS driver
      tension: 150,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnimation, {
      toValue: 0,
      useNativeDriver: false,
      tension: 160,
      friction: 7,
    }).start();
  };

  const getCyclicalCount = () => {
    if (count < maxCount) return 0;
    let currentCount = count;
    let division = (currentCount - (currentCount % maxCount)) / maxCount;
    return count % maxCount === 0 ? division - 1 : division;
  };

  const getCount = () => {
    if (count <= maxCount || !isCyclical) return count;
    let currentCount = count;
    return currentCount % maxCount === 0 ? maxCount : count % maxCount;
  };

  const handlePress = () => {
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
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: radius * 2 + 24,
            height: radius * 2 + 24,
            borderRadius: radius + 12,
            backgroundColor,
            shadowColor: baseColor,
            transform: [{ scale }],
          },
        ]}
      >
        <Svg width={radius * 2} height={radius * 2}>
          {/* Arka plan çemberi */}
          <Circle
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
            fill="none"
            stroke={currentTheme.segmentedControlBackgroundColor}
            strokeWidth={strokeWidth}
          />

          {/* İlerleme çemberi */}
          <AnimatedCircle
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
            fill="none"
            stroke={baseColor}
            strokeWidth={strokeWidth}
            strokeDasharray={[circumference, circumference]}
            strokeDashoffset={animatedStrokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${radius},${radius}`}
          />

          {/* Sayı */}
          <Text
            onLayout={event => {
              const { width, height } = event.nativeEvent.layout;
              setTextDimensions({ width, height });
            }}
            x={radius}
            y={textDimensions.height / 2 + radius - 10}
            textAnchor="middle"
            stroke={currentTheme.textColor}
            fontSize={radius / 3}
          >
            {getCount()}
          </Text>

          {/* Açıklama */}
          {description && (
            <Text
              x={radius}
              y={radius + radius / 2.4}
              textAnchor="middle"
              stroke={currentTheme.textColor}
              fontSize={12}
              fontWeight={'200'}
            >
              {description}
            </Text>
          )}
        </Svg>

        {/* Döngü sayacı */}
        {isCyclical && (
          <View
            style={[
              styles.cyclicalWrapper,
              {
                top: radius + 40,
                left: radius - 17 + 12,
              },
            ]}
          >
            <Icon
              name="repeat"
              type={Icons.FontAwesome6}
              color={currentTheme.textColor}
              size={15}
              solid
            />
            <NativeText
              style={[
                styles.cyclicalCountText,
                { color: currentTheme.textColor },
              ]}
            >
              {getCyclicalCount()}
            </NativeText>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

/** Hex -> rgba dönüştürücü */
function hexToRgba(hex: string, alpha: number) {
  try {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return hex;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return hex;
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
    elevation: 2,
  },

  cyclicalWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },

  cyclicalCountText: {
    marginLeft: 5,
    fontSize: 20,
    textAlign: 'center',
  },
});

export default CircleProgressBar;
