import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  ApiLanguage,
  getApiLanguage,
  getQuranTranslationEdition,
  getRandomAyahNumber,
} from './helpers';

type QuranEditionResponse = {
  text: string;
  edition?: { identifier?: string };
  surah?: { englishName?: string; name?: string; number?: number };
  numberInSurah?: number;
};

type QuranAyah = {
  arabicText: string;
  translation: string;
  surahName?: string;
  surahNumber?: number;
  verseNumber?: number;
};

type Props = {
  currentDateKey: string;
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
  shadowColor: string;
  muted: string;
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
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'right',
      color: colors.primary,
      lineHeight: 30,
      marginBottom: 12,
    },
    translationText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textColor,
      marginBottom: 8,
    },
    metaText: {
      fontSize: 12,
      color: colors.muted,
      textAlign: 'left',
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

const buildSurahLabel = (ayah: QuranAyah | null) => {
  if (!ayah?.surahName) {
    return null;
  }
  if (ayah.verseNumber) {
    return `${ayah.surahName} • ${ayah.verseNumber}`;
  }
  return ayah.surahName;
};

const QuranAyahCardComponent: React.FC<Props> = ({ currentDateKey }) => {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const apiLanguage = useMemo<ApiLanguage>(
    () => getApiLanguage(i18n.language),
    [i18n.language],
  );

  const [state, setState] = useState<LoadState<QuranAyah>>({
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
        shadowColor: currentTheme.shadowColor || '#0F172A',
        muted: 'rgba(148,163,184,0.9)',
        danger: currentTheme.systemRed || '#DC2626',
      }),
    [currentTheme],
  );

  const fetchAyah = useCallback(async () => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));
    try {
      const ayahNumber = getRandomAyahNumber();
      const translationEdition = getQuranTranslationEdition(apiLanguage);
      const url = `https://api.alquran.cloud/v1/ayah/${ayahNumber}/editions/quran-uthmani,${translationEdition}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('FAILED');
      }
      const json = await response.json();
      const editions: QuranEditionResponse[] = Array.isArray(json?.data)
        ? json.data
        : [];
      const arabic = editions.find(
        item => item.edition?.identifier === 'quran-uthmani',
      );
      const translation = editions.find(
        item => item.edition?.identifier === translationEdition,
      );
      if (!arabic || !translation) {
        throw new Error('MISSING');
      }
      setState({
        loading: false,
        error: null,
        data: {
          arabicText: arabic.text,
          translation: translation.text,
          surahName:
            translation.surah?.englishName ||
            translation.surah?.name ||
            arabic.surah?.englishName ||
            arabic.surah?.name,
          surahNumber: translation.surah?.number || arabic.surah?.number,
          verseNumber: translation.numberInSurah || arabic.numberInSurah,
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
    fetchAyah();
  }, [fetchAyah, currentDateKey]);

  const handleManualRefresh = useCallback(() => {
    if (!state.loading) {
      fetchAyah();
    }
  }, [fetchAyah, state.loading]);

  const innerBody = () => {
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

    const surahLabel = buildSurahLabel(state.data);

    return (
      <>
        <Text style={styles.arabicText}>{state.data.arabicText}</Text>
        <Text style={styles.translationText}>{state.data.translation}</Text>
        {surahLabel ? <Text style={styles.metaText}>{surahLabel}</Text> : null}
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
          {t('prayerTime.inspiration.quranTitle')}
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
      {innerBody()}
    </Container>
  );
};

export const QuranAyahCard = memo(QuranAyahCardComponent);
