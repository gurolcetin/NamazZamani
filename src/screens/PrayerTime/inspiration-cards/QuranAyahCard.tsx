import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import {
  ApiLanguage,
  getApiLanguage,
  getQuranTranslationEdition,
  getRandomAyahNumber,
} from './helpers';
import {
  saveQuranAyah,
  selectCachedQuranAyah,
} from '../../../../libs/redux/reducers/prayerTimesCache';

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
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'right',
      color: colors.textColor,
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
  const dispatch = useDispatch();
  const cachedAyah = useSelector(selectCachedQuranAyah);

  const [state, setState] = useState<LoadState<QuranAyah>>({
    loading: !cachedAyah.data,
    error: null,
    data: cachedAyah.data,
  });
  const [displayMode, setDisplayMode] =
    useState<'arabic' | 'translation'>('translation');

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

  const cachedAyahData = cachedAyah.data;
  const currentAyahData = state.data;
  useEffect(() => {
    if (cachedAyahData && cachedAyahData !== currentAyahData) {
      setState(prev => ({
        ...prev,
        data: cachedAyahData,
      }));
    }
  }, [cachedAyahData, currentAyahData]);

  const fetchAyah = useCallback(async () => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));
    try {
      const ayahNumber = await getRandomAyahNumber();
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
      const mapped: QuranAyah = {
        arabicText: arabic.text,
        translation: translation.text,
        surahName:
          translation.surah?.englishName ||
          translation.surah?.name ||
          arabic.surah?.englishName ||
          arabic.surah?.name,
        surahNumber: translation.surah?.number || arabic.surah?.number,
        verseNumber: translation.numberInSurah || arabic.numberInSurah,
      };
      setState({
        loading: false,
        error: null,
        data: mapped,
      });
      setDisplayMode('translation');
      dispatch(saveQuranAyah(mapped));
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        error: t('prayerTime.inspiration.error'),
      }));
    }
  }, [apiLanguage, dispatch, t]);

  useEffect(() => {
    fetchAyah();
  }, [fetchAyah, currentDateKey]);

  const handleManualRefresh = useCallback(() => {
    if (!state.loading) {
      fetchAyah();
    }
  }, [fetchAyah, state.loading]);

  const handleToggleLanguage = useCallback(() => {
    if (state.loading || !state.data) {
      return;
    }
    setDisplayMode(prev => (prev === 'arabic' ? 'translation' : 'arabic'));
  }, [state.data, state.loading]);

  const handleShare = useCallback(async () => {
    if (!state.data) {
      return;
    }
    const isArabicView = displayMode === 'arabic';
    const surahLabel = buildSurahLabel(state.data);
    const shareText = `${isArabicView ? state.data.arabicText : state.data.translation}${surahLabel ? `\n\n${surahLabel}` : ''}`;
    const trimmedShareText = shareText.trim();
    if (!trimmedShareText) {
      return;
    }
    try {
      await Share.share({
        message: trimmedShareText,
      });
    } catch {
      // no-op
    }
  }, [displayMode, state.data]);

  const innerBody = () => {
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

    const surahLabel = buildSurahLabel(state.data);
    const isArabicView = displayMode === 'arabic';

    return (
      <>
        <Text
          style={isArabicView ? styles.arabicText : styles.translationText}
        >
          {isArabicView ? state.data.arabicText : state.data.translation}
        </Text>
        {surahLabel ? <Text style={styles.metaText}>{surahLabel}</Text> : null}
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
          {t('prayerTime.inspiration.quranTitle')}
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
            accessibilityLabel={
              displayMode === 'arabic'
                ? t('prayerTime.inspiration.showTranslation')
                : t('prayerTime.inspiration.showArabic')
            }
            style={[
              styles.actionButton,
              (state.loading || !state.data) && styles.disabledButton,
            ]}
            onPress={handleToggleLanguage}
            disabled={state.loading || !state.data}
          >
            <Icon
              type={Icons.MaterialDesignIcons}
              name="translate"
              size={20}
              color={currentTheme.textColor}
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
      {innerBody()}
    </Container>
  );
};

export const QuranAyahCard = memo(QuranAyahCardComponent);
