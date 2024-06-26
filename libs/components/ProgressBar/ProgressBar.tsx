import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {useTheme} from '../../core/providers';

interface ProgressBarProps {
  progress: number;
  style?: StyleProp<ViewStyle> | undefined;
}

const ProgressBar = ({progress, style}: ProgressBarProps) => {
  const [widthAnim] = useState(new Animated.Value(0));
  const {currentTheme} = useTheme();

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 1000, // Animasyon süresi (ms)
      easing: Easing.linear, // Animasyon türü
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.progress,
          {
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: currentTheme.systemGreen,
          },
          style,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
});

export default ProgressBar;
