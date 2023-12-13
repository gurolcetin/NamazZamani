import React, {useEffect, useRef, useState} from 'react';
import {
  TouchableWithoutFeedback,
  View,
  Text,
  Animated,
  useWindowDimensions,
} from 'react-native';
import styles from './style';
import {useTheme} from '../../core/providers';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {globalStyle} from '../../styles';

interface TabProps {
  key: string | number;
  value: string;
}

interface TabButtonGroupProps {
  tabs: TabProps[];
  onTabChange: (index: string | number) => void;
}

const TabButtonGroup = (props: TabButtonGroupProps) => {
  const {tabs, onTabChange} = props;
  const {height, width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {currentTheme} = useTheme();
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
  }, [selectedTab, isLandscape, insets, position]);

  const handleAnimated = () => {
    const tabWidth = position.layoutWidth - 14; // 14 is padding of container
    setTabViewWidth(tabWidth);
    const singleTabWidth = tabWidth / tabs.length;
    const animateToPosition = selectedTab * singleTabWidth;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: animateToPosition,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleLayout = event => {
    const {
      x,
      y,
      width: layoutWidth,
      height: layoutHeight,
    } = event.nativeEvent.layout;
    setPosition({x, y, layoutWidth, layoutHeight});
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: currentTheme.inputBackgroundColor,
        },
      ]}>
      <Animated.View
        style={[
          styles.animatedView,
          {
            width: tabViewWidth / tabs.length,
            backgroundColor: currentTheme.primary,
            transform: [
              {
                translateX,
              },
            ],
          },
        ]}
      />
      {tabs.map((item, index) => {
        const isActive = index === selectedTab;

        return (
          <View style={globalStyle.flex1} key={item.key}>
            <TouchableWithoutFeedback
              style={[
                globalStyle.flex1,
                {
                  backgroundColor: currentTheme.backgroundColor,
                },
              ]}
              onPress={() => {
                setSelectedTab(index);
                onTabChange(item.key);
              }}>
              <View style={[styles.item]}>
                <Text
                  style={[
                    styles.text,
                    isActive && {color: currentTheme.activeTabTextColor},
                    !isActive && {color: currentTheme.inputColor},
                  ]}>
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

export default TabButtonGroup;
