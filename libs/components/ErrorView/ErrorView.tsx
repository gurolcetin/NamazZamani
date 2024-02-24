import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {isNullOrUndefined} from 'typescript-util-functions';

interface ErrorViewProps {
  message: string;
  duration?: number;
  style?: StyleProp<ViewStyle> | undefined;
}

const ErrorView = ({message, duration, style}: ErrorViewProps) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (duration && !isNullOrUndefined(duration) && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  return (
    isVisible && (
      <Animated.View style={[styles.container, {opacity: fadeAnim}, style]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginLeft: 'auto',
    padding: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  message: {
    color: 'white',
  },
});

export default ErrorView;
