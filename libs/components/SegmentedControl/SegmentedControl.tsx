import React, { useEffect, useRef, useState } from 'react';
import {
  TouchableWithoutFeedback,
  View,
  Text,
  Animated,
  useWindowDimensions,
} from 'react-native';
import styles from './style';
import { useTheme } from '../../core/providers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyle } from '../../styles';

interface TabProps {
  key: string | number;
  value: string;
}

interface SegmentedControlProps {
  tabs: TabProps[];
  onTabChange: (index: string | number) => void;
  marginHorizontal?: number;
  marginTop?: number;
  marginBottom?: number;
}

const SegmentedControl = (props: SegmentedControlProps) => {
  const { tabs, onTabChange } = props;
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const [isLandscape, setIsLandscape] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
    layoutWidth: 0,
    layoutHeight: 0,
  });
  const [tabViewWidth, setTabViewWidth] = useState(position.layoutWidth);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsLandscape(width >= height);
  }, [width, height]);

  useEffect(() => {
    handleAnimated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, isLandscape, insets, position]);

  const handleAnimated = () => {
    const tabWidth = position.layoutWidth - 12; // container padding (6+6)
    setTabViewWidth(tabWidth);
    const singleTabWidth = tabWidth / tabs.length;
    const animateToPosition = selectedTab * singleTabWidth;
    Animated.timing(translateX, {
      toValue: animateToPosition,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleLayout = (event: {
    nativeEvent: { layout: { x: any; y: any; width: any; height: any } };
  }) => {
    const {
      x,
      y,
      width: layoutWidth,
      height: layoutHeight,
    } = event.nativeEvent.layout;
    setPosition({ x, y, layoutWidth, layoutHeight });
  };

  const primary = currentTheme.primary;

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: currentTheme.cardViewBackgroundColor,
          marginHorizontal: props.marginHorizontal ?? 0,
          marginTop: props.marginTop ?? 0,
          marginBottom: props.marginBottom ?? 0,
        },
      ]}
    >
      {/* Gezen primary pill */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.animatedView,
          {
            width: tabViewWidth / tabs.length || 0,
            backgroundColor: primary,
            transform: [{ translateX }],
          },
        ]}
      />

      {tabs.map((item, index) => {
        const isActive = selectedTab === index;
        return (
          <View style={globalStyle.flex1} key={item.key}>
            <TouchableWithoutFeedback
              onPress={() => {
                setSelectedTab(index);
                onTabChange(item.key);
              }}
            >
              <View style={styles.tabButton}>
                <Text
                  style={[
                    styles.text, // önce base stil
                    {
                      color: isActive
                        ? currentTheme.white
                        : currentTheme.textColor,
                    },
                  ]}
                >
                  {item.value}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        );
      })}
    </View>
  );
};

export default SegmentedControl;
