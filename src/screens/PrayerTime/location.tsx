import Ionicons from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const withOpacity = (hex: string, alpha = 0.15) => {
  // #RRGGBB -> rgba
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

function truncateMiddle(text: string, max = 28) {
  if (text.length <= max) return text;
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${text.slice(0, head)}…${text.slice(-tail)}`;
}

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
      <View style={styles.locLeft}>
        <Ionicons name="location" size={16} color={themeColors.primary} />
        <Text numberOfLines={1} style={[styles.locText, { color: txt }]}>
          {loading ? 'Konum alınıyor…' : truncateMiddle(label, 26)}
        </Text>
      </View>

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
  // --- EKLE: yeni konum chip stilleri ---------------------------------------
  locChip: {
    flexShrink: 1,
    maxWidth: '78%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    // iOS gölge
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    // Android gölge
    elevation: 2,
  },
  locLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 60,
    flexShrink: 1,
  },
  locText: {
    fontSize: 15,
    fontWeight: '700',
    maxWidth: 160,
  },
  utcPill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  utcText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
