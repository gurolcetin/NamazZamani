import React, {useEffect, useState} from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import {
  isNullOrEmptyString,
  isNullOrUndefined,
} from 'typescript-util-functions';

interface ErrorViewProps {
  message: string;
  duration?: number;
  style?: StyleProp<ViewStyle> | undefined;
  isClossable?: boolean;
}

const ErrorView = ({message, duration, style, isClossable}: ErrorViewProps) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isNullOrEmptyString(message)) {
      setIsVisible(true);
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
    }
  }, [message]);

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
      <View style={style}>
        <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
          <Text style={styles.message}>{message}</Text>
          {isClossable && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
  },
  closeButton: {
    flex: 0.1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  message: {
    flex: 0.9,
    color: 'white',
  },
});

export default ErrorView;
