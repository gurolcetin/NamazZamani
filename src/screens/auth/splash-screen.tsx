import React, { FC, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  InteractionManager,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../../libs/core/providers';

type SplashScreenProps = {
  navigation: any;
  route: any;
  nextRoute?: string;
  onComplete?: () => void;
};

export const SplashScreen: FC<SplashScreenProps> = ({
  navigation,
  route,
  nextRoute,
  onComplete,
}) => {
  const { currentTheme } = useTheme();
  const targetRoute: string | undefined = nextRoute ?? route?.params?.nextRoute;
  const isDarkTheme = currentTheme.textColor.toLowerCase() === '#ffffff';

  const logoScale = useRef(new Animated.Value(0.86)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(22)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(contentY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        delay: 180,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(navigateNext);
    }, 2700);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateNext = () => {
    InteractionManager.runAfterInteractions(() => {
      onComplete?.();
      if (!targetRoute) {
        return;
      }
      navigation.reset({
        index: 0,
        routes: [{ name: targetRoute }],
      });
    });
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      <StatusBar hidden />

      <View
        style={[
          styles.bgCircleTop,
          {
            backgroundColor: isDarkTheme
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(15,23,42,0.06)',
          },
        ]}
      />
      <View
        style={[
          styles.bgCircleBottom,
          {
            backgroundColor: isDarkTheme
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(15,23,42,0.05)',
          },
        ]}
      />

      <View style={styles.center}>
        <Animated.Image
          source={require('../../../assets/images/bootsplash_logo.png')}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentY }],
            },
          ]}
        >
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: isDarkTheme
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(15,23,42,0.14)',
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: currentTheme.primary,
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  bgCircleTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -90,
    right: -90,
  },
  bgCircleBottom: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    bottom: -130,
    left: -130,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 28,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  progressTrack: {
    width: 160,
    height: 4,
    borderRadius: 999,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
