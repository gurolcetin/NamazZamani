import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Text } from 'react-native';
import { LocationChip } from '../location-chip';
import { ContextualHint, Icon, Icons } from '../../../../libs/components';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../libs/redux/store';
import { FontScaleOption } from '../../../../libs/common/enums';
import { getFontScaleMultiplier } from '../../../../libs/core/helpers';

type Props = {
  label: string;
  utc: string;
  loading?: boolean;
  theme: {
    primary: string;
    textColor?: string;
    cardViewBackgroundColor?: string;
  };

  // Butonlar
  onOpenLocationSelector?: () => void;
  onOpenTuneEditor?: () => void;
  onOpenPrayerTimeSettings?: () => void;

  // İsteğe bağlı stil
  style?: ViewStyle;
  locationHintMessage?: string;
  locationHintFrequencyMs?: number;
  locationHintDurationMs?: number;
};

export const ActionCardGroup = memo((props: Props) => {
  const { t } = useTranslation();
  const fontScalePreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);

  const {
    label,
    utc,
    loading,
    style,
    theme,
    onOpenLocationSelector,
    onOpenTuneEditor,
    onOpenPrayerTimeSettings,
    locationHintMessage,
    locationHintFrequencyMs = 0,
    locationHintDurationMs,
  } = props;

  const locationChip = (
    <LocationChip
      label={label}
      utc={utc}
      style={stylesL.locationChip}
      loading={loading}
      themeColors={{
        primary: theme.primary,
      }}
    />
  );

  const locationAction = (
    <Pressable
      style={stylesL.actionBtn}
      onPress={onOpenLocationSelector}
      accessibilityRole="button"
      disabled={!onOpenLocationSelector}
    >
      <Icon
        type={Icons.MaterialDesignIcons}
        name="map-marker-radius-outline"
        size={20 * fontScaleMultiplier}
        color={theme.primary}
      />
      <Text
        style={[
          stylesL.actionText,
          { color: theme.textColor, fontSize: 12 * fontScaleMultiplier },
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {t('locationSelector.mainLocationSelect')}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={[
        stylesL.card,
        style,
        { backgroundColor: theme.cardViewBackgroundColor || '#FFFFFF' },
      ]}
    >
      {locationChip}
      <View
        style={[
          stylesL.dividerHorizontal,
          { backgroundColor: `${theme.textColor || '#111827'}1A` },
        ]}
      />
      <View style={stylesL.actionsRow}>
        <View style={stylesL.actionCell}>
          {locationHintMessage ? (
            <ContextualHint
              hintId="hint_location_chip"
              message={locationHintMessage}
              frequencyMs={locationHintFrequencyMs}
              durationMs={locationHintDurationMs}
              containerStyle={stylesL.hintContainer}
            >
              {locationAction}
            </ContextualHint>
          ) : (
            locationAction
          )}
        </View>
        <View
          style={[
            stylesL.dividerVertical,
            { backgroundColor: `${theme.textColor || '#111827'}1A` },
          ]}
        />
        <View style={stylesL.actionCell}>
          <Pressable
            style={stylesL.actionBtn}
            onPress={onOpenTuneEditor}
            accessibilityRole="button"
            disabled={!onOpenTuneEditor}
          >
            <Icon
              type={Icons.MaterialDesignIcons}
              name="bell-outline"
              size={20 * fontScaleMultiplier}
              color={theme.primary}
            />
            <Text
              style={[
                stylesL.actionText,
                { color: theme.textColor, fontSize: 12 * fontScaleMultiplier },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {t('locationSelector.tuneEditAction')}
            </Text>
          </Pressable>
        </View>
        <View
          style={[
            stylesL.dividerVertical,
            { backgroundColor: `${theme.textColor || '#111827'}1A` },
          ]}
        />
        <View style={stylesL.actionCell}>
          <Pressable
            style={stylesL.actionBtn}
            onPress={onOpenPrayerTimeSettings}
            accessibilityRole="button"
            disabled={!onOpenPrayerTimeSettings}
          >
            <Icon
              type={Icons.MaterialDesignIcons}
              name="cog-outline"
              size={20 * fontScaleMultiplier}
              color={theme.primary}
            />
            <Text
              style={[
                stylesL.actionText,
                { color: theme.textColor, fontSize: 12 * fontScaleMultiplier },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {t('locationSelector.mainPrayerTimeSettings')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const stylesL = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  locationChip: {
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dividerHorizontal: {
    height: StyleSheet.hairlineWidth,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
  },
  actionCell: {
    flex: 1,
  },
  hintContainer: {
    width: '100%',
  },
  actionBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 10,
    minHeight: 84,
  },
  actionText: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  dividerVertical: {
    width: StyleSheet.hairlineWidth,
    height: 42,
  },
});
