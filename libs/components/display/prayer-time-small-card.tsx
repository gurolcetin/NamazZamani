// PrayerTimeSmallCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../core/providers';
import { Icon, Icons } from '../Icons/Icons';
import { PrayerTimeKey, SmallCard } from '../../common/types';

export const PRAYER_TIME_ICONS: Record<PrayerTimeKey, { type: any; name: string }> = {
  Fajr: { type: Icons.MaterialDesignIcons, name: 'weather-moonset-down' },
  Sunrise: { type: Icons.MaterialDesignIcons, name: 'weather-sunset-up' },
  Dhuhr: { type: Icons.MaterialDesignIcons, name: 'weather-sunny' },
  Asr: { type: Icons.MaterialDesignIcons, name: 'weather-sunset' },
  Maghrib: { type: Icons.MaterialDesignIcons, name: 'weather-sunset-down' },
  Isha: { type: Icons.FontAwesome6, name: 'moon' },
};

export const PrayerTimeSmallCard: React.FC<{
  item: SmallCard;
  index: number;
}> = ({ item, index }) => {
  const { currentTheme } = useTheme();
  const active = item.isCurrent;
  const withOpacity = (hex: string, alpha = 0.12) => {
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
  const baseCardStyle = active
    ? {
        backgroundColor: currentTheme.primary,
        shadowOpacity: 0.25,
      }
    : {
        backgroundColor: currentTheme.cardViewBackgroundColor,
        shadowOpacity: 0.08,
      };

  const iconBoxStyle = active
    ? {
        backgroundColor: 'rgba(255,255,255,0.18)',
      }
    : {
        backgroundColor: withOpacity(currentTheme.primary, 0.18),
      };

  const textColor = active ? '#FFFFFF' : currentTheme.textColor;

  return (
    <View
      style={[
        styles.smallCard,
        index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 },
        baseCardStyle,
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.iconBox, iconBoxStyle]}>
          <Icon
            type={PRAYER_TIME_ICONS[item.key].type}
            name={PRAYER_TIME_ICONS[item.key].name as any}
            color={active ? '#FFFFFF' : currentTheme.primary}
            size={20}
            solid
          />
        </View>
        <Text style={[styles.smallTitle, { color: textColor }]}>
          {item.label}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.smallTime, { color: textColor }]}>
          {item.time}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  smallCard: {
    flex: 1,
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallTitle: { fontSize: 14, fontWeight: '600' },
  right: {
    alignItems: 'flex-end',
  },
  smallTime: { fontSize: 16, fontWeight: '700' },
});
