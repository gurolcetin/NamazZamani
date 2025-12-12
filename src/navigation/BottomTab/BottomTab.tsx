import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Platform,
  Pressable,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBanner, useTheme } from '../../../libs/core/providers';
import { Icon } from '../../../libs/components';
import {
  bottomTabMenuItems,
  defaultNativeStackNavOptions,
  BOTTOM_TAB_BANNER_AD_UNIT_ID,
} from '../../../libs/common/constants';
import { useTranslation } from 'react-i18next';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSelector } from 'react-redux';
import { FontScaleOption } from '../../../libs/common/enums';
import { getFontScaleMultiplier } from '../../../libs/core/helpers';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, navigation }: any) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0.9)).current;
  const { setBannerLoaded } = useBanner();
  const applicationSettings = useSelector(
    (state: any) => state.applicationSettings,
  );
  const fontScalePreference =
    applicationSettings?.fontScale ?? FontScaleOption.MEDIUM;
  const fontScaleMultiplier = useMemo(
    () => getFontScaleMultiplier(fontScalePreference),
    [fontScalePreference],
  );
  useEffect(() => {
    if (opacity) {
      if (applicationSettings.isScrollReachToBottom) {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300, // 300ms içinde değişsin
          useNativeDriver: true,
        }).start();
      } else if (!applicationSettings.isScrollReachToBottom) {
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [applicationSettings.isScrollReachToBottom, opacity]);

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom: Math.max(insets.bottom, 6),
          borderTopColor: currentTheme.bottomTabBorderTopColor,
          paddingTop: Platform.OS === 'ios' ? 2 : 4,
        },
      ]}
    >
      {/* Arka plan */}
      <Animated.View
        pointerEvents="none" // <-- dokunmaları yutmasın
        style={[
          StyleSheet.absoluteFill,
          { opacity, backgroundColor: currentTheme.menuBackgroundColor },
        ]}
      />

      {/* İçerik */}
      <View style={styles.tabBar}>
        {state.routes.map(
          (
            route: { key: React.Key | null | undefined; name: string },
            index: number,
          ) => {
            const isFocused = state.index === index;

            const item = bottomTabMenuItems(currentTheme).find(
              i => i.route === route.name,
            );

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                style={({ pressed }) => [
                  styles.tabItem,
                  pressed && styles.tabItemPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={item ? t(item.label.key) : undefined}
                onPress={onPress}
                onLongPress={onLongPress}
              >
                <Icon
                  type={item?.type}
                  name={item?.icon}
                  color={
                    !isFocused ? currentTheme.placeholderTextColor : item?.color
                  }
                  solid={item?.solid}
                  size={item?.size}
                />

                <Text
                  style={[
                    styles.iconText,
                    {
                      color: !isFocused
                        ? currentTheme.placeholderTextColor
                        : item?.color,
                      fontSize: 10 * fontScaleMultiplier,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item && t(item.label.key)}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={BOTTOM_TAB_BANNER_AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdLoaded={() => {
            setBannerLoaded(true);
          }}
          onAdFailedToLoad={() => {
            setBannerLoaded(false);
          }}
        />
      </View>
    </View>
  );
};

const BottomTabNavigator = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarStyle: { position: 'absolute', height: 50, borderTopWidth: 0 },
      }}
    >
      {bottomTabMenuItems(currentTheme).map(item => (
        <Tab.Screen
          key={item.id}
          name={item.route}
          component={item.component}
          options={defaultNativeStackNavOptions(currentTheme, item, t)}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  iconText: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  tabItemPressed: {
    opacity: 0.8,
  },
  bannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});

export default BottomTabNavigator;
