import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Animated} from 'react-native';

const BackgroundColorChanger = ({isActive, style, children}) => {
  const [colorAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isActive ? 1 : 0,
      duration: 500, // Animasyon süresi (ms)
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', 'rgba(0, 255, 0, 0.2)'],
  });

  return (
    <Animated.View style={[styles.container, {backgroundColor}, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default BackgroundColorChanger;
