import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../core/providers';

type GenderOption = { label: string; value: string };

interface GenderSegmentedControlProps {
  options: GenderOption[];
  value: string;
  onChange: (value: string) => void;
}

const FormSegmentedControl: React.FC<GenderSegmentedControlProps> = ({
  options,
  value,
  onChange,
}) => {
  const { currentTheme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const rawIndex = options.findIndex(o => o.value === value);
  const hasSelection = rawIndex !== -1;
  const selectedIndex = hasSelection ? rawIndex : null;

  useEffect(() => {
    if (!containerWidth) return;
    if (selectedIndex === null) return; // nothing selected; don't animate

    const innerWidth = containerWidth - 12; // padding (6+6)
    const singleWidth = innerWidth / options.length;
    const target = selectedIndex * singleWidth;

    Animated.timing(translateX, {
      toValue: target,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, containerWidth, translateX, options.length]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const primary = currentTheme.primary;

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.genderContainer,
        styles.genderContainerInner,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      {/* Selection background: only visible when something is selected */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.selectionOverlay,
          {
            width:
              containerWidth > 0 ? (containerWidth - 12) / options.length : 0,
            backgroundColor: currentTheme.cardViewBackgroundColor,
            opacity: hasSelection ? 1 : 0,
            transform: [{ translateX }],
          },
        ]}
      />

      {options.map(opt => {
        const active = value === opt.value;
        return (
          <View style={styles.genderOption} key={opt.value}>
            <Pressable
              style={[styles.genderChip, styles.genderChipPressable]}
              onPress={() => onChange(opt.value)}
            >
              <Text
                style={[
                  styles.genderChipText,
                  {
                    color: active ? primary : currentTheme.textColor,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  genderContainer: {
    flexDirection: 'row',
  },
  genderContainerInner: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 24,
  },
  selectionOverlay: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  genderOption: {
    flex: 1,
  },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 10,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 0,
  },
  genderChipPressable: {
    height: 38,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FormSegmentedControl;
