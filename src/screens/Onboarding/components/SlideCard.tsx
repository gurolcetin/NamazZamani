import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { ThemeType } from '../../../../libs/common/models';

type Slide = {
  key: string;
  title: string;
  description: string;
  illustrationColor?: string;
  animation?: any;
};

type Props = {
  slide: Slide;
  currentTheme: ThemeType;
  useLottie?: boolean;
};

const SlideCard: React.FC<Props> = ({
  slide,
  currentTheme,
  useLottie = false,
}) => {
  const { width } = useWindowDimensions();

  const LottieView = useMemo(() => {
    if (!useLottie) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require('lottie-react-native');
      return module.default ?? module;
    } catch {
      return null;
    }
  }, [useLottie]);

  return (
    <View style={[styles.container, { width }]}>
      <Text style={[styles.title, { color: currentTheme.textColor }]}>
        {slide.title}
      </Text>
      <Text style={[styles.description, { color: currentTheme.textColor }]}>
        {slide.description}
      </Text>
      <View
        style={[
          styles.illustration,
          {
            backgroundColor:
              slide.illustrationColor || currentTheme.cardViewBackgroundColor,
            borderColor: currentTheme.cardViewBorderColor,
          },
        ]}
      >
        {LottieView && slide.animation ? (
          <LottieView
            source={slide.animation}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
          />
        ) : (
          <Text
            style={[styles.placeholderText, { color: currentTheme.textColor }]}
          >
            Illustration
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  illustration: {
    width: '100%',
    height: 260,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});

export default SlideCard;
