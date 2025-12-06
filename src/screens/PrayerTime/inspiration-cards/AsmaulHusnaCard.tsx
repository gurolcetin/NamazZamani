import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Icons } from '../../../../libs/components';
import { useTheme } from '../../../../libs/core/providers';
import {
  ASMA_UL_HUSNA_ENDPOINT,
  ISLAMIC_API_KEY,
} from '../../../../libs/common/constants/externalApis';
import { getApiLanguage, pickRandomItem } from './helpers';
import { useDispatch, useSelector } from 'react-redux';
import {
  saveAsmaulHusna,
  selectCachedAsma,
} from '../../../../libs/redux/reducers/prayerTimesCache';

type Props = {
  currentDateKey: string;
};

type AsmaEntry = {
  name?: string;
  transliteration?: string;
  meaning?: string;
  translation?: string;
  description?: string;
};

type AsmaData = {
  arabicName: string;
  transliteration?: string;
  meaning: string;
};

type LoadState<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

const createStyles = (colors: {
  cardBg: string;
  primary: string;
  textColor: string;
  muted: string;
  shadowColor: string;
  danger: string;
}) =>
  StyleSheet.create({
    card: {
      marginTop: 16,
      borderRadius: 24,
      padding: 20,
      backgroundColor: colors.cardBg,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textColor,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15,23,42,0.08)',
    },
    disabledButton: {
      opacity: 0.4,
    },
    arabicText: {
      fontSize: 44,
      fontWeight: '600',
      color: colors.textColor,
      textAlign: 'right',
      marginBottom: 8,
    },
    transliteration: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'right',
      marginBottom: 12,
    },
    meaning: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.textColor,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textColor,
    },
    errorText: {
      fontSize: 14,
      color: colors.danger,
    },
  });

const AsmaulHusnaCardComponent: React.FC<Props> = ({ currentDateKey }) => {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const apiLanguage = useMemo(
    () => getApiLanguage(i18n.language),
    [i18n.language],
  );
  const dispatch = useDispatch();
  const cachedAsma = useSelector(selectCachedAsma);

  const [state, setState] = useState<LoadState<AsmaData>>({
    loading: !cachedAsma.data,
    error: null,
    data: cachedAsma.data,
  });

  const styles = useMemo(
    () =>
      createStyles({
        cardBg: currentTheme.cardViewBackgroundColor,
        primary: currentTheme.primary,
        textColor: currentTheme.textColor,
        muted: 'rgba(148,163,184,0.9)',
        shadowColor: currentTheme.shadowColor || '#0F172A',
        danger: currentTheme.systemRed || '#DC2626',
      }),
    [currentTheme],
  );

  const cachedAsmaData = cachedAsma.data;
  const currentAsmaData = state.data;
  useEffect(() => {
    if (cachedAsmaData && cachedAsmaData !== currentAsmaData) {
      setState(prev => ({
        ...prev,
        data: cachedAsmaData,
      }));
    }
  }, [cachedAsmaData, currentAsmaData]);

  const fetchAsma = useCallback(async () => {
    if (!ISLAMIC_API_KEY) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: t('prayerTime.inspiration.apiKeyError'),
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const url = `${ASMA_UL_HUSNA_ENDPOINT}?language=${apiLanguage}&api_key=${ISLAMIC_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('FAILED');
      }
      const json = await response.json();
      const entries: AsmaEntry[] = Array.isArray(json?.data.names)
        ? json.data.names
        : [];
      if (!entries.length) {
        throw new Error('EMPTY');
      }
      const randomEntry = pickRandomItem(entries);
      const meaning =
        (
          randomEntry.meaning ||
          randomEntry.translation ||
          randomEntry.description ||
          ''
        ).trim() ||
        randomEntry.transliteration ||
        randomEntry.name ||
        '';
      const mapped: AsmaData = {
        arabicName: randomEntry.name || '',
        transliteration: randomEntry.transliteration,
        meaning: meaning.trim(),
      };
      setState({
        loading: false,
        error: null,
        data: mapped,
      });
      dispatch(saveAsmaulHusna(mapped));
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        error: t('prayerTime.inspiration.error'),
      }));
    }
  }, [apiLanguage, dispatch, t]);

  useEffect(() => {
    fetchAsma();
  }, [fetchAsma, currentDateKey]);

  const handleManualRefresh = useCallback(() => {
    if (!state.loading) {
      fetchAsma();
    }
  }, [fetchAsma, state.loading]);

  const handleShare = useCallback(async () => {
    if (!state.data) {
      return;
    }
    const shareText = [
      state.data.arabicName,
      state.data.transliteration,
      state.data.meaning,
    ]
      .filter(Boolean)
      .join('\n');
    const trimmed = shareText.trim();
    if (!trimmed) {
      return;
    }
    try {
      await Share.share({ message: trimmed });
    } catch {
      // no-op
    }
  }, [state.data]);

  const renderBody = () => {
    if (state.loading && !state.data) {
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={currentTheme.primary} />
          <Text style={styles.loadingText}>
            {t('prayerTime.inspiration.loading')}
          </Text>
        </View>
      );
    }

    if (state.error && !state.data) {
      return <Text style={styles.errorText}>{state.error}</Text>;
    }

    if (!state.data) {
      return null;
    }

    return (
      <>
        <Text style={styles.arabicText}>{state.data.arabicName}</Text>
        {state.data.transliteration ? (
          <Text style={styles.transliteration}>
            {state.data.transliteration}
          </Text>
        ) : null}
        <Text style={styles.meaning}>{state.data.meaning}</Text>
      </>
    );
  };

  const showTapToRetry = state.error && !state.loading && !state.data;
  const Container = showTapToRetry ? TouchableOpacity : View;
  const containerProps = showTapToRetry
    ? {
        activeOpacity: 0.8,
        onPress: handleManualRefresh,
      }
    : {};

  return (
    <Container style={styles.card} {...containerProps}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {t('prayerTime.inspiration.asmaTitle')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('prayerTime.inspiration.share')}
            style={[
              styles.actionButton,
              (state.loading || !state.data) && styles.disabledButton,
            ]}
            onPress={handleShare}
            disabled={state.loading || !state.data}
          >
            <Icon
              type={Icons.FontAwesome6}
              name="arrow-up-from-bracket"
              size={18}
              color={currentTheme.textColor}
              solid
            />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('prayerTime.inspiration.refresh')}
            style={[
              styles.actionButton,
              state.loading && styles.disabledButton,
            ]}
            onPress={handleManualRefresh}
            disabled={state.loading}
          >
            <Icon
              type={Icons.MaterialDesignIcons}
              name="refresh"
              size={20}
              color={currentTheme.textColor}
            />
          </TouchableOpacity>
        </View>
      </View>
      {renderBody()}
    </Container>
  );
};

export const AsmaulHusnaCard = memo(AsmaulHusnaCardComponent);
