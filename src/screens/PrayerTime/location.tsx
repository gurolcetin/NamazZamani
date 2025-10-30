import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const withOpacity = (hex: string, alpha = 0.15) => {
  const m = hex?.replace('#', '');
  if (!m || (m.length !== 6 && m.length !== 3)) return `rgba(0,0,0,${alpha})`;
  const norm =
    m.length === 3
      ? m
          .split('')
          .map(c => c + c)
          .join('')
      : m;
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type LocationChipProps = {
  label: string;
  utc: string;
  onPress?: () => void;
  themeColors: {
    primary: string;
    text?: string;
    isDark?: boolean;
  };
  loading?: boolean;
};

export function LocationChip({
  label,
  utc,
  onPress,
  themeColors,
  loading,
}: LocationChipProps) {
  const [pressed, setPressed] = useState(false);

  const bg = withOpacity(themeColors.primary, themeColors.isDark ? 0.22 : 0.12);
  const border = withOpacity(
    themeColors.primary,
    themeColors.isDark ? 0.45 : 0.25,
  );
  const txt = themeColors.text ?? (themeColors.isDark ? '#F5F7FA' : '#15171A');
  const utcBg = withOpacity(
    themeColors.primary,
    themeColors.isDark ? 0.35 : 0.2,
  );

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={`Konum: ${label}, saat dilimi: ${utc}`}
      style={[
        styles.locChip,
        {
          backgroundColor: bg,
          borderColor: border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Soldaki kısım (ikon + metin) */}
      <View style={styles.locLeft}>
        <Ionicons
          name="location"
          size={17}
          color={themeColors.primary}
          style={styles.icon}
        />
        <Text style={[styles.locText, { color: txt }]}>
          {loading ? 'Konum alınıyor…' : label}
        </Text>
      </View>

      {/* Sağdaki UTC kısmı */}
      <View
        style={[
          styles.utcPill,
          { backgroundColor: utcBg, borderColor: border },
        ]}
      >
        <Text style={[styles.utcText, { color: txt }]}>{utc}</Text>
        <Ionicons name="chevron-down" size={14} color={txt} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,      // 🔹 dikey boşluk arttı
    paddingHorizontal: 14,    // 🔹 yatay boşluk arttı
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,                  // 🔹 sol ve sağ bloklar arası nefes payı
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  locLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1,
    flexGrow: 1,
    flexBasis: 0,
    gap: 8, // 🔹 ikon ile metin arası boşluk arttı
    marginRight: 8,
  },
  icon: {
    marginTop: 2,
    flexShrink: 0,
  },
  locText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    flexWrap: 'wrap',
    lineHeight: 20,
    maxWidth: '90%'
  },
  utcPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,    // 🔹 UTC etiketinin iç boşluğu da arttı
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  utcText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
