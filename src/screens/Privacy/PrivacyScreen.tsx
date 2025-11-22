import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../libs/core/providers';
import { RootRoutes } from '../../navigation/Routes';
import { useTranslation } from 'react-i18next';

const PRIVACY_KEY = 'privacyAccepted';

// Dil → HTML URL haritası
const PRIVACY_MAP: Record<string, string> = {
  tr: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/tr.html',
  en: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/en.html',
  ar: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/ar.html',
  es: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/es.html',
  de: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/de.html',
  fr: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/fr.html',
  it: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/it.html',
  id: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/id.html',
  pt: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/pt.html',
  zh: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/zh.html',
  ja: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/ja.html',
  ko: 'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/ko.html',
};

type Props = {
  navigation: any;
  onAccept: () => void;
  nextRoute: string;
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  type?: 'primary' | 'secondary';
  color: string;
  textColor: string;
  borderColor: string;
  style?: StyleProp<ViewStyle>;
};

const ActionButton: React.FC<ButtonProps> = ({
  label,
  onPress,
  type = 'primary',
  color,
  textColor,
  borderColor,
  style,
}) => {
  const isPrimary = type === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        style,
        {
          backgroundColor: isPrimary ? color : 'transparent',
          borderColor: isPrimary ? 'transparent' : borderColor,
        },
      ]}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.buttonLabel,
          { color: isPrimary ? textColor : borderColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/* -------------------------------------------------------------------------- */
/* HTML → Basit Markdown Benzeri Metin → RN <Text>                            */
/* -------------------------------------------------------------------------- */

const extractBodyOrHtml = (html: string) => {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
};

// HTML'deki bazı tagleri markdown benzeri bir stringe çeviriyoruz
const convertHtmlToMarkdownLike = (html: string) => {
  let body = extractBodyOrHtml(html);

  // Satır sonları için normalize
  body = body.replace(/\r\n/g, '\n');

  // <br> → satır sonu
  body = body.replace(/<br\s*\/?>/gi, '\n');

  // Başlıklar
  body = body.replace(/<h1[^>]*>/gi, '# ');
  body = body.replace(/<\/h1>/gi, '\n\n');
  body = body.replace(/<h2[^>]*>/gi, '## ');
  body = body.replace(/<\/h2>/gi, '\n\n');

  // Paragraflar
  body = body.replace(/<p[^>]*>/gi, '');
  body = body.replace(/<\/p>/gi, '\n\n');

  // Bold
  body = body.replace(/<(strong|b)>/gi, '**');
  body = body.replace(/<\/(strong|b)>/gi, '**');

  // Diğer HTML taglerini tamamen sil
  body = body.replace(/<\/?[^>]+(>|$)/g, '');

  return body.trim();
};

// Bu fonksiyon markdown benzeri metni parçalayıp Text olarak render ediyor
const renderRichText = (source: string, textColor: string) => {
  const lines = source.split('\n');

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      // Boş satır → görsel boşluk
      return <Text key={index} style={{ height: 8 }} />;
    }

    let textLine = trimmed;
    let style: any = [styles.descriptionLine, { color: textColor }];

    if (trimmed.startsWith('## ')) {
      style = [styles.heading2, { color: textColor }];
      textLine = trimmed.substring(3);
    } else if (trimmed.startsWith('# ')) {
      style = [styles.heading1, { color: textColor }];
      textLine = trimmed.substring(2);
    }

    const parts = textLine.split(/(\*\*.*?\*\*)/g);

    return (
      <Text key={index} style={style}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);
            return (
              <Text key={idx} style={{ fontWeight: '700' }}>
                {content}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  });
};

/* ----------------------- SADECE DESCRIPTION BÖLÜMÜ ------------------------ */

type PrivacyContentProps = {
  currentTheme: any;
  language: string;
};

const PrivacyContent: React.FC<PrivacyContentProps> = ({
  currentTheme,
  language,
}) => {
  const { t } = useTranslation();
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => {
    const baseLang = (language || 'en').split('-')[0];
    return PRIVACY_MAP[baseLang] ?? PRIVACY_MAP['en'];
  }, [language]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(url);
        if (!res.ok) {
          setError(t('privacyScreen.loadError'));
        }

        const text = await res.text();
        if (mounted) {
          setHtml(text);
        }
      } catch {
        if (mounted) {
          setError(t('privacyScreen.loadError'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [url, t]);

  const parsedText = useMemo(
    () => (html ? convertHtmlToMarkdownLike(html) : ''),
    [html],
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.cardViewBackgroundColor,
          borderColor: currentTheme.menuBorderColor,
        },
      ]}
    >
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={currentTheme.primary} />
          <Text style={{ marginTop: 8, color: currentTheme.textColor }}>
            {t('privacyScreen.loading')}
          </Text>
        </View>
      ) : error ? (
        <ScrollView
          style={styles.descriptionContainer}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          <Text
            style={[styles.descriptionLine, { color: currentTheme.textColor }]}
          >
            {error}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.descriptionContainer}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator
        >
          {renderRichText(parsedText, currentTheme.textColor)}
        </ScrollView>
      )}
    </View>
  );
};

/* ---------------------------- ANA EKRAN BÖLÜMÜ ---------------------------- */

const PrivacyScreen: React.FC<Props> = ({
  navigation,
  onAccept,
  nextRoute,
}) => {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const initialBaseLang = (i18n.language || 'tr').split('-')[0];
  const [selectedLang, setSelectedLang] = useState<string>(initialBaseLang);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langButtonLayout, setLangButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const baseLang = (i18n.language || 'tr').split('-')[0];
    setSelectedLang(baseLang);
  }, [i18n.language]);

  type LangOption = {
    key: string;
    label: string;
    flag?: any;
  };

  const languageOptions: LangOption[] = useMemo(
    () => [
      {
        key: 'tr',
        label: 'Türkçe',
        flag: require('../../../assets/images/flags/turkey.png'),
      },
      {
        key: 'en',
        label: 'English',
        flag: require('../../../assets/images/flags/united-kingdom.png'),
      },
      {
        key: 'ar',
        label: 'العربية',
      },
      {
        key: 'es',
        label: 'Español',
      },
      {
        key: 'de',
        label: 'Deutsch',
      },
      {
        key: 'fr',
        label: 'Français',
      },
      {
        key: 'it',
        label: 'Italiano',
      },
      {
        key: 'id',
        label: 'Bahasa Indonesia',
      },
      {
        key: 'pt',
        label: 'Português',
      },
      {
        key: 'zh',
        label: '中文',
      },
      {
        key: 'ja',
        label: '日本語',
      },
      {
        key: 'ko',
        label: '한국어',
      },
    ],
    [],
  );

  const currentLangOption =
    languageOptions.find(o => o.key === selectedLang) || languageOptions[0];

  const handleLangChange = useCallback(
    (code: string) => {
      if (code === selectedLang) {
        setIsLangOpen(false);
        return;
      }
      setSelectedLang(code);
      setIsLangOpen(false);

      // TODO: diğer diller gelince bu koşul silinecek
      if (code === 'tr' || code === 'en') {
        i18n.changeLanguage(code);
      }
    },
    [selectedLang, i18n],
  );

  const handleAccept = useCallback(async () => {
    await AsyncStorage.setItem(PRIVACY_KEY, 'true');
    onAccept();
    navigation.replace(nextRoute ?? RootRoutes.Main);
  }, [navigation, nextRoute, onAccept]);

  const handleDecline = useCallback(() => {
    Alert.alert(
      t('privacyScreen.alertTitle'),
      t('privacyScreen.alertMessage'),
      [
        {
          text: t('privacyScreen.alertClose'),
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  }, [t]);

  const onLangButtonLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setLangButtonLayout({ x, y, width, height });
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      {/* Header ve dropdown'u saran relative wrapper */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: currentTheme.textColor }]}>
            {t('privacyScreen.title')}
          </Text>

          {/* Dil seçici buton */}
          <TouchableOpacity
            style={[
              styles.langSelectorButton,
              {
                borderColor: currentTheme.menuBorderColor,
                backgroundColor: currentTheme.cardViewBackgroundColor,
              },
            ]}
            onPress={() => setIsLangOpen(prev => !prev)}
            activeOpacity={0.9}
            onLayout={onLangButtonLayout}
          >
            <View style={styles.langSelectorContent}>
              {currentLangOption.flag && (
                <Image
                  source={currentLangOption.flag}
                  style={styles.langFlagSmall}
                />
              )}
              <View style={{ marginLeft: 6 }}>
                <Text
                  style={[
                    styles.langSelectorLabel,
                    { color: currentTheme.textColor },
                  ]}
                >
                  {currentLangOption.label}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.langSelectorArrow,
                { color: currentTheme.textColor },
              ]}
            >
              {isLangOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inline dropdown - header'ın üstünde overlay, diğer componentleri itmeden */}
        {isLangOpen && langButtonLayout && (
          <View
            style={[
              styles.langDropdown,
              {
                backgroundColor: currentTheme.cardViewBackgroundColor,
                borderColor: currentTheme.menuBorderColor,
                top: langButtonLayout.y + langButtonLayout.height + 6,
                left: langButtonLayout.x,
                width: langButtonLayout.width,
              },
            ]}
          >
            <ScrollView
              style={{ maxHeight: 260 }}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {languageOptions.map(opt => {
                const active = opt.key === selectedLang;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.langOptionRow,
                      {
                        backgroundColor: active
                          ? currentTheme.menuBorderColor
                          : 'transparent',
                      },
                    ]}
                    onPress={() => handleLangChange(opt.key)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.langOptionLeft}>
                      {opt.flag && (
                        <Image source={opt.flag} style={styles.langFlag} />
                      )}
                      <Text
                        style={[
                          styles.langOptionLabel,
                          { color: currentTheme.textColor },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    {active && (
                      <Text
                        style={[
                          styles.langOptionActiveMark,
                          { color: currentTheme.primary },
                        ]}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* İçerik artık GitHub HTML'den ve seçili dile göre geliyor */}
      <PrivacyContent currentTheme={currentTheme} language={selectedLang} />

      <View style={styles.actions}>
        <ActionButton
          label={t('privacyScreen.decline')}
          onPress={handleDecline}
          type="secondary"
          color={currentTheme.primary}
          textColor={currentTheme.backgroundColor}
          borderColor={currentTheme.primary}
          style={styles.actionSpacing}
        />
        <ActionButton
          label={t('privacyScreen.accept')}
          onPress={handleAccept}
          color={currentTheme.primary}
          textColor={currentTheme.backgroundColor}
          borderColor={currentTheme.primary}
          style={styles.actionSpacing}
        />
      </View>

      {/* Ekranın herhangi bir yerine basınca dropdown'ı kapat */}
      {isLangOpen && (
        <TouchableWithoutFeedback onPress={() => setIsLangOpen(false)}>
          <View style={styles.outsideTapArea} />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

/* ---------------------------------- Styles --------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    position: 'relative',
  },

  headerWrapper: {
    marginBottom: 12,
    position: 'relative', // dropdown bunun içinde absolute
  },
  header: {
    flexDirection: 'column',
    gap: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },

  // Dil seçici (kapalı görünüm)
  langSelectorButton: {
    marginTop: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // hafif shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  langSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langSelectorLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  langSelectorArrow: {
    fontSize: 11,
    opacity: 0.7,
    marginLeft: 8,
  },
  langFlagSmall: {
    width: 25,
    height: 25,
    borderRadius: 3,
    marginLeft: 2,
    resizeMode: 'contain',
  },

  // Inline dropdown (overlay)
  langDropdown: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: 'hidden',
    zIndex: 20,
  },
  langOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  langFlag: {
    width: 25,
    height: 25,
    borderRadius: 3,
    marginRight: 8,
    resizeMode: 'contain',
  },
  langOptionLabel: {
    fontSize: 14,
  },
  langOptionActiveMark: {
    fontSize: 14,
    fontWeight: '700',
  },

  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  descriptionContainer: {
    flex: 1,
  },
  descriptionLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  heading1: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  heading2: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionSpacing: {
    marginHorizontal: 6,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // dışarı tıklama overlay'i
  outsideTapArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});

export default PrivacyScreen;
export { PRIVACY_KEY };
