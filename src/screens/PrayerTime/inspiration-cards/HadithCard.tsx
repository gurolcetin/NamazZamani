import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Icons } from '../../../../libs/components';
import { useTheme } from '../../../../libs/core/providers';
import {
  HADITH_API_BASE_URL,
  HADITH_API_KEY,
  HADITH_DEFAULT_BOOK,
} from '../../../../libs/common/constants/externalApis';
import { getApiLanguage } from './helpers';

type Props = {
  currentDateKey: string;
};

type HadithData = {
  arabic: string;
  translation: string;
  bookName?: string;
  number?: string | number;
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
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textColor,
    },
    refreshButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15,23,42,0.08)',
    },
    arabicText: {
      fontSize: 19,
      fontWeight: '700',
      textAlign: 'right',
      color: colors.primary,
      lineHeight: 28,
      marginBottom: 12,
    },
    translationText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textColor,
      marginBottom: 8,
    },
    sourceText: {
      fontSize: 12,
      color: colors.muted,
      textAlign: 'right',
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

const extractHadithCandidate = (payload: any) => {
  if (!payload) {
    return null;
  }
  if (payload.hadith) {
    return payload.hadith;
  }
  if (payload.hadiths?.data) {
    return Array.isArray(payload.hadiths.data)
      ? payload.hadiths.data[0]
      : payload.hadiths.data;
  }
  if (Array.isArray(payload.hadiths)) {
    return payload.hadiths[0];
  }
  if (Array.isArray(payload.data)) {
    return payload.data[0];
  }
  if (payload.data) {
    return payload.data;
  }
  return null;
};

const HadithCardComponent: React.FC<Props> = ({ currentDateKey }) => {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const apiLanguage = useMemo(
    () => getApiLanguage(i18n.language),
    [i18n.language],
  );

  const [state, setState] = useState<LoadState<HadithData>>({
    loading: true,
    error: null,
    data: null,
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

  const fetchHadith = useCallback(async () => {
    if (!HADITH_API_KEY) {
      setState({
        loading: false,
        error: t('prayerTime.inspiration.apiKeyError'),
        data: null,
      });
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));
    try {
      const url = `${HADITH_API_BASE_URL}/hadiths/?apiKey=${HADITH_API_KEY}&book=${HADITH_DEFAULT_BOOK}&language=${apiLanguage}`;
      console.log(url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('FAILED');
      }
      const json = await response.json();
      const candidate = extractHadithCandidate(json);
      if (!candidate) {
        throw new Error('EMPTY');
      }
      const arabic =
        candidate.hadithArabic ||
        candidate.arabic ||
        candidate.text ||
        candidate.hadithText ||
        '';
      const translation =
        candidate.hadithEnglish ||
        candidate.translation ||
        candidate.hadithText ||
        '';
      const bookName =
        candidate.book?.bookName ||
        candidate.book?.name ||
        candidate.bookName ||
        candidate.collection ||
        candidate.book;
      const number =
        candidate.hadithNumberInBook ||
        candidate.hadithNumber ||
        candidate.number ||
        candidate.id;
      setState({
        loading: false,
        error: null,
        data: {
          arabic,
          translation,
          bookName,
          number,
        },
      });
    } catch {
      setState({
        loading: false,
        error: t('prayerTime.inspiration.error'),
        data: null,
      });
    }
  }, [apiLanguage, t]);

  useEffect(() => {
    fetchHadith();
  }, [fetchHadith, currentDateKey]);

  const handleManualRefresh = useCallback(() => {
    if (!state.loading) {
      fetchHadith();
    }
  }, [fetchHadith, state.loading]);

  const renderBody = () => {
    if (state.loading) {
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={currentTheme.primary} />
          <Text style={styles.loadingText}>
            {t('prayerTime.inspiration.loading')}
          </Text>
        </View>
      );
    }

    if (state.error) {
      return <Text style={styles.errorText}>{state.error}</Text>;
    }

    if (!state.data) {
      return null;
    }

    const sourceLabel =
      state.data.bookName && state.data.number
        ? t('prayerTime.inspiration.hadithSource', {
            book: state.data.bookName,
            number: state.data.number,
          })
        : state.data.bookName || '';

    return (
      <>
        <Text style={styles.arabicText}>{state.data.arabic}</Text>
        <Text style={styles.translationText}>{state.data.translation}</Text>
        {sourceLabel ? (
          <Text style={styles.sourceText}>{sourceLabel}</Text>
        ) : null}
      </>
    );
  };

  const Container = state.error ? TouchableOpacity : View;
  const containerProps =
    state.error && !state.loading
      ? {
          activeOpacity: 0.8,
          onPress: handleManualRefresh,
        }
      : {};

  return (
    <Container style={styles.card} {...containerProps}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {t('prayerTime.inspiration.hadithTitle')}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('prayerTime.inspiration.refresh')}
          style={styles.refreshButton}
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
      {renderBody()}
    </Container>
  );
};

export const HadithCard = memo(HadithCardComponent);
