// PrayerTimeSmallCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../core/providers';
import { Icon, Icons } from '../Icons/Icons';
import { PrayerTimeKey, SmallCard } from '../../common/types';

export const ICONS: Record<PrayerTimeKey, { type: any; name: string }> = {
  Fajr: { type: Icons.Ionicons, name: 'moon-outline' },
  Sunrise: { type: Icons.MaterialDesignIcons, name: 'weather-sunset-up' },
  Dhuhr: { type: Icons.MaterialDesignIcons, name: 'weather-sunny' },
  Asr: { type: Icons.MaterialDesignIcons, name: 'weather-sunset' },
  Maghrib: { type: Icons.MaterialDesignIcons, name: 'weather-sunset-down' },
  Isha: { type: Icons.Ionicons, name: 'moon' },
};

export const PrayerTimeSmallCard: React.FC<{
  item: SmallCard;
  index: number;
}> = ({ item, index }) => {
  const { currentTheme } = useTheme();
  const active = item.isCurrent;

  const baseCardStyle = active
    ? {
        backgroundColor: currentTheme.primary,
        borderColor: currentTheme.primary,
        shadowOpacity: 0.25,
      }
    : {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        shadowOpacity: 0.08,
      };

  const iconBoxStyle = active
    ? {
        backgroundColor: 'rgba(255,255,255,0.18)',
      }
    : {
        backgroundColor: '#E6FBF3', // soft yeşil
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
            type={ICONS[item.key].type}
            name={ICONS[item.key].name as any}
            color={active ? '#FFFFFF' : currentTheme.primary}
            size={18}
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
    borderWidth: 1,
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
