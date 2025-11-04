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
  const { currentTheme } = useTheme(); // ✅ hook artık bir bileşenin içinde
  const active = item.isCurrent;

  return (
    <View
      style={[
        styles.smallCard,
        index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 },
        active && { backgroundColor: currentTheme.primary },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon
          type={ICONS[item.key].type}
          name={ICONS[item.key].name as any}
          color={active ? 'white' : 'black'}
          size={18}
        />
        <Text style={[styles.smallTitle, active && styles.smallTitleActive]}>
          {item.label}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={[styles.smallTime, active && styles.smallTimeActive]}>
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallTitle: { fontSize: 16, fontWeight: '700' },
  smallTitleActive: { color: '#fff' },
  smallTime: { fontSize: 18, fontWeight: '800' },
  smallTimeActive: { color: '#fff' },
});
