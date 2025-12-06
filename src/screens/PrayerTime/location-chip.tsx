import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../libs/core/providers';
import { Icon, Icons } from '../../../libs/components';

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
  const { t } = useTranslation();
  const { currentTheme } = useTheme();

  // Arka planı eskisi gibi primary’den türetiyoruz, ekranın genel dengesi bozulmasın
  const bg = currentTheme.cardViewBackgroundColor;
  const txt = currentTheme.textColor;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={t('locationChip.accessibilityLabel', {
        label,
        utc,
      })}
      style={[
        styles.locChip,
        {
          backgroundColor: bg,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Sol taraf: ikon + metin */}
      <View style={styles.locLeft}>
        <Icon
          type={Icons.FontAwesome6}
          name="location-dot"
          size={20}
          color={themeColors.primary}
          style={styles.icon}
          solid
        />
        <View style={styles.locTextWrap}>
          <Text style={[styles.locText, { color: txt }]} numberOfLines={1}>
            {label}
          </Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={themeColors.primary}
              style={styles.loadingIndicator}
            />
          ) : null}
        </View>
      </View>

      {/* Sağ taraf: UTC + değiştirilebilirlik ikonu */}
      <View style={styles.utcRight}>
        <Text
          style={[
            styles.utcTextRight,
            { color: currentTheme.placeholderTextColor },
          ]}
          numberOfLines={1}
        >
          {utc}
        </Text>
        <Icon
          type={Icons.MaterialDesignIcons}
          name="chevron-down"
          size={18}
          color={currentTheme.placeholderTextColor}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingVertical: 10,
    paddingHorizontal: 14,

    borderRadius: 14, // biraz daha yuvarlak, Figma hissi

    gap: 12,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  locLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flexGrow: 1,
    flexBasis: 0,
    gap: 8,
    marginRight: 8,
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  locText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    flexWrap: 'nowrap',
    lineHeight: 20,
    maxWidth: '100%',
  },
  locTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  loadingIndicator: {
    marginLeft: 2,
  },
  utcRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  utcTextRight: {
    fontSize: 13,
    fontWeight: '500',
  },
});
