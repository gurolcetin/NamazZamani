// --- LocationActionsCard.tsx (veya aynı dosyada üstte) ---------------------
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { LocationChip } from '../location';

type Props = {
  label: string;
  utc: string;
  loading?: boolean;
  isDark?: boolean;
  theme: { primary: string; textColor?: string };

  // Butonlar
  onOpenLocationSelector?: () => void;
  onPickDate?: () => void;
  onOpenImsakiye?: () => void;

  // İsteğe bağlı stil
  style?: ViewStyle;
};

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

export const ActionCardGroup = memo((props: Props) => {
  const {
    label,
    utc,
    loading,
    isDark,
    theme,
    onOpenLocationSelector,
    onPickDate,
    onOpenImsakiye,
    style,
  } = props;

  const border = withOpacity(theme.primary, isDark ? 0.28 : 0.18);
  const bg = withOpacity(theme.primary, isDark ? 0.12 : 0.08);

  const pillBg = (alpha = 0.18) => withOpacity(theme.primary, alpha);

  return (
    <View
      style={[
        stylesL.card,
        { backgroundColor: bg, borderColor: border },
        style,
      ]}
    >
      {/* Başlık satırı */}
      <View style={stylesL.headerRow}>
        <Text style={[stylesL.title, { color: theme.textColor }]}>
          Konum & Vakitler
        </Text>
      </View>

      {/* Konum satırı (chip + “değiştir”) */}
      <View style={stylesL.locationRow}>
        <LocationChip
          label={label}
          utc={utc}
          loading={loading}
          themeColors={{
            primary: theme.primary,
            text: theme.textColor,
            isDark,
          }}
          onPress={onOpenLocationSelector}
        />
      </View>

      {/* Butonlar yan yana */}
      <View style={stylesL.actionsRow}>
        <Pressable
          onPress={onPickDate}
          style={({ pressed }) => [
            stylesL.actionBtn,
            {
              backgroundColor: pillBg(isDark ? 0.22 : 0.14),
              borderColor: border,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={stylesL.actionLeft}>
            <View style={[stylesL.iconWrap, { backgroundColor: pillBg(0.25) }]}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={theme.primary}
              />
            </View>
            <Text style={[stylesL.actionTitle, { color: theme.textColor }]}>Tarih Seç</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={onOpenImsakiye}
          style={({ pressed }) => [
            stylesL.actionBtn,
            {
              backgroundColor: pillBg(isDark ? 0.22 : 0.14),
              borderColor: border,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={stylesL.actionLeft}>
            <View style={[stylesL.iconWrap, { backgroundColor: pillBg(0.25) }]}>
              <Ionicons name="list-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[stylesL.actionTitle, { color: theme.textColor }]}>İmsakiye</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
});

const stylesL = StyleSheet.create({
  card: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    // iOS gölge
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    // Android gölge
    elevation: 1,
  },
  headerRow: {
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.7,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  changeBtnText: { fontSize: 13, fontWeight: '700' },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    maxWidth: '48%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontSize: 14, fontWeight: '800' },
});
