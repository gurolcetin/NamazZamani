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
import { Icon, IconProps } from '../Icons/Icons';

type SegmentedOption = {
  label: string;
  value: string;
  iconProps?: IconProps;
};

interface GenderSegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  fontScaleMultiplier?: number;
  compact?: boolean;
}

const FormSegmentedControl: React.FC<GenderSegmentedControlProps> = ({
  options,
  value,
  onChange,
  fontScaleMultiplier = 1,
  compact = false,
}) => {
  const { currentTheme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const rawIndex = options.findIndex(o => o.value === value);
  const hasSelection = rawIndex !== -1;
  const selectedIndex = hasSelection ? rawIndex : null;
  const primary = currentTheme.primary;
  const containerInset = compact ? 4 : 6;
  const containerRadius = compact ? 20 : 24;
  const optionRadius = compact ? 16 : 18;
  const optionLabelFontSize = 14 * fontScaleMultiplier;
  const optionMinHeight = compact
    ? Math.max(36, Math.round(optionLabelFontSize * 2))
    : 42;
  const optionVerticalPadding = compact ? 6 : 10;

  useEffect(() => {
    if (!containerWidth) return;
    if (selectedIndex === null) return;

    const innerWidth = containerWidth - containerInset * 2;
    const singleWidth = innerWidth / options.length;
    const target = selectedIndex * singleWidth;

    Animated.timing(translateX, {
      toValue: target,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, containerWidth, translateX, options.length, containerInset]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.genderContainer,
        styles.genderContainerInner,
        {
          padding: containerInset,
          borderRadius: containerRadius,
        },
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      {/* SEÇİLİ ARKA PLAN (kayma animasyonu) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.selectionOverlay,
          {
            width:
              containerWidth > 0
                ? (containerWidth - containerInset * 2) / options.length
                : 0,
            backgroundColor: currentTheme.cardViewBackgroundColor,
            opacity: hasSelection ? 1 : 0,
            transform: [{ translateX }],
            left: containerInset,
            top: containerInset,
            bottom: containerInset,
            borderRadius: optionRadius,
          },
        ]}
      />

      {options.map(opt => {
        const active = value === opt.value;
        return (
          <View style={styles.genderOption} key={opt.value}>
            <Pressable
              style={[
                styles.genderChip,
                styles.genderChipPressable,
                {
                  borderRadius: optionRadius,
                  minHeight: optionMinHeight,
                  paddingVertical: optionVerticalPadding,
                },
              ]}
              onPress={() => onChange(opt.value)}
            >
              <View style={styles.optionContent}>
                {/* ICON (varsa gösterilir) */}
                {opt.iconProps && (
                  <View style={styles.iconWrapper}>
                    <Icon
                      {...opt.iconProps}
                      color={
                        active ? currentTheme.primary : currentTheme.textColor
                      }
                    />
                  </View>
                )}

                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  style={[
                    styles.genderChipText,
                    {
                      color: active ? primary : currentTheme.textColor,
                      fontSize: optionLabelFontSize,
                      lineHeight: Math.round(optionLabelFontSize * 1.15),
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </View>
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
    minHeight: 42,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  genderChipText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 6,
    flexShrink: 0,
  },
});

export default FormSegmentedControl;
