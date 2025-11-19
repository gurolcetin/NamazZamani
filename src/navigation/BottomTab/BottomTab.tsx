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
import { useTheme } from '../../../libs/core/providers';
import { Icon } from '../../../libs/components';
import {
  bottomTabMenuItems,
  defaultNativeStackNavOptions,
} from '../../../libs/common/constants';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, navigation }: any) => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(1)).current;

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          height:
            Platform.OS === 'ios' ? insets.bottom + 40 : insets.bottom + 50,
          borderTopColor: currentTheme.bottomTabBorderTopColor,
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
                    size={20}
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
                  {item?.label}
                </Text>
              </View>
            );
          },
        )}
      </View>
    </View>
  );
};

const BottomTabNavigator = () => {
  const { currentTheme } = useTheme();

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarStyle: { position: 'absolute', height: 50, borderTopWidth: 0 },
        animation: 'shift',
      }}
    >
      {bottomTabMenuItems(currentTheme).map(item => (
        <Tab.Screen
          key={item.id}
          name={item.route}
          component={item.component}
          options={defaultNativeStackNavOptions(currentTheme, item)}
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
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 5,
    flex: 1,
    position: 'relative',
  },
  iconText: {
    fontSize: 10,
    marginTop: 5,
    position: 'absolute',
    top: 22,
    width: '100%',
    flexShrink: 1,
    textAlign: 'center',
    zIndex: 1,
  },
  tabItemTouchable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default BottomTabNavigator;
