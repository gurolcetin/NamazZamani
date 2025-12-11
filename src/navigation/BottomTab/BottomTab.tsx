import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Platform,
  TouchableHighlight,
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

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, navigation }: any) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(1)).current;
  const { setBannerLoaded } = useBanner();

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

            // route.name artık item.route ile birebir eşleşecek
            const item = bottomTabMenuItems(currentTheme).find(
              i => i.route === route.name,
            );

            return (
              <View key={route.key} style={styles.tabItem}>
                <TouchableHighlight
                  onPress={() => navigation.navigate(route.name)}
                  style={styles.tabItemTouchable}
                  underlayColor="transparent"
                >
                  <Icon
                    type={item?.type}
                    name={item?.icon}
                    color={
                      !isFocused
                        ? currentTheme.placeholderTextColor
                        : item?.color
                    }
                    solid={item?.solid}
                    size={item?.size}
                  />
                </TouchableHighlight>

                <Text
                  style={[
                    styles.iconText,
                    {
                      color: !isFocused
                        ? currentTheme.placeholderTextColor
                        : item?.color,
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item && t(item.label.key)}
                </Text>
              </View>
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
    justifyContent: 'flex-start',
    flex: 1,
  },
  iconText: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  tabItemTouchable: {
    paddingVertical: 2,
    alignItems: 'center',
  },
  bannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});

export default BottomTabNavigator;
