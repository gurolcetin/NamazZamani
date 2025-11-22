import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SlideCard from './components/SlideCard';
import Pagination from './components/Pagination';
import { RootRoutes } from '../../navigation/Routes';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../libs/core/providers';
import { ThemeType } from '../../../libs/common/models';

type OnboardingSlide = {
  key: string;
  title: string;
  description: string;
  illustrationColor?: string;
  animation?: any;
};

type Props = {
  onFinish: () => void;
};

const ONBOARDING_KEY = 'onboarded';
const useLottieAnimations = false; // Lottie animasyonları için istenirse true yapılabilir.

const slides: OnboardingSlide[] = [
  {
    key: 'welcome',
    title: 'Hoş geldin!',
    description:
      'Namaz vakitlerini takip etmek için hızlı ve modern bir deneyim.',
    illustrationColor: '#90caf9',
  },
  {
    key: 'location',
    title: 'Konumunu seç',
    description: 'Doğru vakitler için konumunu belirle veya hızlıca değiştir.',
    illustrationColor: '#a5d6a7',
  },
  {
    key: 'reminders',
    title: 'Bildirimler',
    description: 'Hatırlatıcıları açarak hiçbir vakti kaçırma.',
    illustrationColor: '#ffcc80',
  },
];

const OnboardingScreen: React.FC<Props> = ({ onFinish }) => {
  const { currentTheme } = useTheme();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const renderItem: ListRenderItem<OnboardingSlide> = useCallback(
    ({ item }) => (
      <SlideCard
        slide={item}
        currentTheme={currentTheme as ThemeType}
        useLottie={useLottieAnimations}
      />
    ),
    [currentTheme],
  );

  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 50 }),
    [],
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, scrollToIndex]);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onFinish();
    navigation.replace(RootRoutes.Main);
  }, [navigation, onFinish]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View
      style={[styles.screen, { backgroundColor: currentTheme.backgroundColor }]}
    >
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        renderItem={renderItem}
        keyExtractor={item => item.key}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: false,
          },
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      <Pagination
        data={slides}
        scrollX={scrollX}
        width={width}
        activeColor={currentTheme.primary}
        inactiveColor={currentTheme.textColor}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleSkip} style={styles.textButton}>
          <Text
            style={[styles.textButtonLabel, { color: currentTheme.textColor }]}
          >
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={isLastSlide ? completeOnboarding : handleNext}
          style={[styles.ctaButton, { backgroundColor: currentTheme.primary }]}
        >
          <Text
            style={[styles.ctaLabel, { color: currentTheme.backgroundColor }]}
          >
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  textButtonLabel: {
    fontSize: 16,
  },
  ctaButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
