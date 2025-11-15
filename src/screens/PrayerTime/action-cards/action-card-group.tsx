import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';
import { LocationChip } from '../location';

type Props = {
  label: string;
  utc: string;
  loading?: boolean;
  isDark?: boolean;
  theme: {
    primary: string;
    textColor?: string;
    cardViewBackgroundColor?: string;
  };

  // Butonlar
  onOpenLocationSelector?: () => void;
  onPickDate?: () => void;
  onOpenImsakiye?: () => void;
  onOpenQibla?: () => void;

  // İsteğe bağlı stil
  style?: ViewStyle;
};

export const ActionCardGroup = memo((props: Props) => {
  const { t } = useTranslation();
  const {
    label,
    utc,
    loading,
    isDark,
    theme,
    onOpenLocationSelector,
    onPickDate,
    onOpenImsakiye,
    onOpenQibla,
  } = props;

  return (
    <View style={[stylesL.card]}>
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
              backgroundColor: theme.cardViewBackgroundColor,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={stylesL.actionLeft}>
            <Ionicons name="calendar-outline" size={24} color={theme.primary} />
            <Text style={[stylesL.actionTitle, { color: theme.textColor }]}>
              {t('actionCardGroup.pickDate')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={onOpenImsakiye}
          style={({ pressed }) => [
            stylesL.actionBtn,
            {
              backgroundColor: theme.cardViewBackgroundColor,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={stylesL.actionLeft}>
            <Ionicons name="list-outline" size={24} color={theme.primary} />
            <Text style={[stylesL.actionTitle, { color: theme.textColor }]}>
              {t('actionCardGroup.imsakiye')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={onOpenQibla}
          style={({ pressed }) => [
            stylesL.actionBtn,
            {
              backgroundColor: theme.cardViewBackgroundColor,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={stylesL.actionLeft}>
            <Ionicons name="compass-outline" size={24} color={theme.primary} />
            <Text style={[stylesL.actionTitle, { color: theme.textColor }]}>
              {t('actionCardGroup.qibla')}
            </Text>
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
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  actionLeft: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
