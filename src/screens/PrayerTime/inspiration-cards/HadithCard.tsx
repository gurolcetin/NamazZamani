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
import { HADITH_API_BASE_URL } from '../../../../libs/common/constants/externalApis';
import { ApiLanguage, getApiLanguage, pickRandomItem } from './helpers';

type Props = {
  currentDateKey: string;
};

type HadithData = {
  arabic: string;
  translation: string;
  bookName?: string;
  number?: string | number;
};

type HadeethEncOneResponse = {
  id?: string | number;
  title?: string;
  title_ar?: string;
  hadeeth?: string;
  hadeeth_ar?: string;
  translation?: string;
  translation_ar?: string;
  explanation?: string;
  explanation_ar?: string;
  grade?: string;
  grade_ar?: string;
  reference?: string;
  reference_ar?: string;
  attribution?: string;
  attribution_ar?: string;
  categories?: string[];
  translations?: string[];
};

type HadeethCategory = {
  id: string;
  title?: string;
  hadeeths_count?: string;
  parent_id?: string | null;
};

type HadeethListItem = {
  id: string;
  title?: string;
  translations?: string[];
};

type HadeethListResponse = {
  data?: HadeethListItem[];
  meta?: {
    current_page?: string;
    last_page?: string;
    total_items?: number | string;
    per_page?: string;
  };
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
      color: colors.textColor,
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

const HADEETH_LIST_PER_PAGE = 20;
const HADEETH_CATEGORY_ATTEMPTS = 6;
const HADEETH_LIST_ATTEMPTS = 4;
const HADEETH_SOURCE_LABEL = 'HadeethEnc.com';

const buildApiUrl = (
  path: string,
  params: Record<string, string | number | undefined>,
) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');
  return `${HADITH_API_BASE_URL}${path}?${query}`;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('FAILED');
  }
  return (await response.json()) as T;
}

const sanitizeText = (input?: string | null) => input?.trim() || undefined;

const fetchHadeethCategories = async (
  language: ApiLanguage,
): Promise<HadeethCategory[]> =>
  fetchJson<HadeethCategory[]>(buildApiUrl('/categories/roots/', { language }));

const fetchHadeethList = async (
  language: ApiLanguage,
  categoryId: string,
  page = 1,
): Promise<HadeethListResponse> =>
  fetchJson<HadeethListResponse>(
    buildApiUrl('/hadeeths/list/', {
      language,
      category_id: categoryId,
      page,
      per_page: HADEETH_LIST_PER_PAGE,
    }),
  );

const extractRandomHadeethId = (
  language: ApiLanguage,
  response: HadeethListResponse | null | undefined,
): string | null => {
  if (!response?.data?.length) {
    return null;
  }
  const validItems = response.data.filter(item =>
    !item.translations?.length ? true : item.translations.includes(language),
  );
  if (!validItems.length) {
    return null;
  }
  return pickRandomItem(validItems).id;
};

const pickRandomHadeethIdFromCategory = async (
  language: ApiLanguage,
  categoryId: string,
): Promise<string | null> => {
  const firstPage = await fetchHadeethList(language, categoryId, 1);
  const firstSelection = extractRandomHadeethId(language, firstPage);
  if (firstSelection) {
    return firstSelection;
  }

  const totalPages = Number(firstPage.meta?.last_page || 1);
  if (Number.isNaN(totalPages) || totalPages <= 1) {
    return null;
  }

  for (let attempt = 0; attempt < HADEETH_LIST_ATTEMPTS; attempt += 1) {
    const randomPage = Math.floor(Math.random() * totalPages) + 1;
    if (randomPage === Number(firstPage.meta?.current_page || 1)) {
      continue;
    }
    const pageResponse = await fetchHadeethList(
      language,
      categoryId,
      randomPage,
    );
    const selection = extractRandomHadeethId(language, pageResponse);
    if (selection) {
      return selection;
    }
  }

  return null;
};

const pickRandomHadeethId = async (language: ApiLanguage): Promise<string> => {
  const categories = await fetchHadeethCategories(language);
  if (!categories?.length) {
    throw new Error('NO_CATEGORIES');
  }
  const available = [...categories];
  const attempts = Math.min(HADEETH_CATEGORY_ATTEMPTS, available.length);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const category = pickRandomItem(available);
    const categoryIndex = available.indexOf(category);
    if (categoryIndex >= 0) {
      available.splice(categoryIndex, 1);
    }
    const hadeethId = await pickRandomHadeethIdFromCategory(
      language,
      category.id,
    );
    if (hadeethId) {
      return hadeethId;
    }
  }

  throw new Error('NO_HADEETH');
};

const fetchHadeethContent = async (
  language: ApiLanguage,
  id: string,
): Promise<HadeethEncOneResponse> =>
  fetchJson<HadeethEncOneResponse>(
    buildApiUrl('/hadeeths/one/', { language, id }),
  );

const buildHadithData = (
  payload?: HadeethEncOneResponse,
): HadithData | null => {
  if (!payload) {
    return null;
  }
  const arabicText =
    sanitizeText(payload?.hadeeth_ar) || sanitizeText(payload?.hadeeth);
  const translationText =
    sanitizeText(payload?.translation) ||
    sanitizeText(payload?.hadeeth) ||
    sanitizeText(payload?.title);

  if (!arabicText || !translationText) {
    return null;
  }

  const bookName =
    sanitizeText(payload?.attribution) ||
    sanitizeText(payload?.reference) ||
    sanitizeText(payload?.attribution_ar) ||
    sanitizeText(payload?.reference_ar) ||
    HADEETH_SOURCE_LABEL;

  const number = payload?.id;

  return {
    arabic: arabicText,
    translation: translationText,
    bookName,
    number,
  };
};

const fetchRandomHadithForLanguage = async (
  language: ApiLanguage,
): Promise<HadithData> => {
  const hadeethId = await pickRandomHadeethId(language);
  const payload = await fetchHadeethContent(language, hadeethId);
  const mapped = buildHadithData(payload);
  if (!mapped) {
    throw new Error('EMPTY');
  }
  return mapped;
};

const fetchRandomHadith = async (
  language: ApiLanguage,
): Promise<HadithData> => {
  const languageOrder: ApiLanguage[] =
    language === 'en' ? ['en'] : [language, 'en'];
  let lastError: unknown = null;

  for (const lang of languageOrder) {
    try {
      return await fetchRandomHadithForLanguage(lang);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('FAILED');
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
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));
    try {
      const hadith = await fetchRandomHadith(apiLanguage);
      setState({
        loading: false,
        error: null,
        data: hadith,
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
