import React, {useEffect, useRef, useState} from 'react';
import {
  TouchableWithoutFeedback,
  View,
  Text,
  Animated,
  useWindowDimensions,
} from 'react-native';
import styles from './style';
import {getWidth} from '../../core/utils';
import {useTheme} from '../../core/providers';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {globalStyle} from '../../styles';

interface TabProps {
  key: string | number;
  value: string;
}

interface TabButtonGroupProps {
  tabs: TabProps[];
}

const TabButtonGroup = (props: TabButtonGroupProps) => {
  const {tabs} = props;
  const {height, width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {currentTheme} = useTheme();
  const [isLandscape, setIsLandscape] = useState(false);
  const [value, setValue] = useState(0);
  const [tabViewWidth, setTabViewWidth] = useState(getWidth() - 84);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsLandscape(width >= height);
  }, [width, height]);

  useEffect(() => {
    handleAnimated();
  }, [value, isLandscape, insets]);

  const handleAnimated = () => {
    const paddingAndMargin = isLandscape ? insets.left + insets.right + 84 : 84;
    const tabWidth = getWidth() - paddingAndMargin;
    setTabViewWidth(tabWidth);
    const singleTabWidth = tabWidth / tabs.length;
    const divider = value * singleTabWidth;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: divider,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <View
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
        const isActive = index === value;

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
                setValue(index);
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
