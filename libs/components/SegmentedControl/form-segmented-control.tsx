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

  const selectedIndex = Math.max(
    0,
    options.findIndex(o => o.value === value),
  );

  useEffect(() => {
    if (!containerWidth) return;
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
        styles.genderContainer, // kendi style'ında yoksa aşağıya ekleyebilirsin
        {
          flexDirection: 'row',
          padding: 6,
          borderRadius: 24,
          backgroundColor: '#f3f4f6',
        },
      ]}
    >
      {/* Kayan beyaz pill (GenderChip tarzı) */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 6,
          top: 6,
          bottom: 6,
          width:
            containerWidth > 0 ? (containerWidth - 12) / options.length : 0,
          borderRadius: 18,
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
          transform: [{ translateX }],
        }}
      />

      {options.map(opt => {
        const active = value === opt.value;
        return (
          <View style={{ flex: 1 }} key={opt.value}>
            <Pressable
              style={[
                styles.genderChip,
                {
                  // Artık arka planı pill hallediyor, chip transparan
                  backgroundColor: 'transparent',
                  shadowOpacity: 0,
                  height: 38,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
              onPress={() => onChange(opt.value)}
            >
              <Text
                style={[
                  styles.genderChipText,
                  {
                    color: active ? primary : '#6b7280',
                    fontSize: 14,
                    fontWeight: '600',
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
  genderChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  genderChipText: {
    textAlign: 'center',
  },
});

export default FormSegmentedControl;
