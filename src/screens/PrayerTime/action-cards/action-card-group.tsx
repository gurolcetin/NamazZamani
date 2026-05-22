import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LocationChip } from '../location-chip';
import { ContextualHint } from '../../../../libs/components';

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
  locationHintMessage?: string;
  locationHintFrequencyMs?: number;
  locationHintDurationMs?: number;
};

export const ActionCardGroup = memo((props: Props) => {
  const {
    label,
    utc,
    loading,
    isDark,
    theme,
    onOpenLocationSelector,
    locationHintMessage,
    locationHintFrequencyMs = 0,
    locationHintDurationMs,
  } = props;

  const locationChip = (
    <LocationChip
      label={label}
      utc={utc}
      style={stylesL.locationChipFullWidth}
      loading={loading}
      themeColors={{
        primary: theme.primary,
        text: theme.textColor,
        isDark,
      }}
      onPress={onOpenLocationSelector}
    />
  );

  return (
    <View style={[stylesL.card]}>
      {/* Konum satırı (chip + “değiştir”) */}
      <View style={stylesL.locationRow}>
        {locationHintMessage ? (
          <ContextualHint
            hintId="hint_location_chip"
            message={locationHintMessage}
            frequencyMs={locationHintFrequencyMs}
            durationMs={locationHintDurationMs}
            containerStyle={stylesL.locationChipFullWidth}
          >
            {locationChip}
          </ContextualHint>
        ) : (
          locationChip
        )}
      </View>
    </View>
  );
});

const stylesL = StyleSheet.create({
  card: {
    marginTop: 0,
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
  locationChipFullWidth: {
    flex: 1,
    width: '100%',
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
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
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
