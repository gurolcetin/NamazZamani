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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../libs/core/providers';
import { RootRoutes } from '../../navigation/Routes';

const PRIVACY_KEY = 'privacyAccepted';

const PRIVACY_HTML_URL =
  'https://gurolcetin.github.io/namaz-zamani-public-files/privacy-terms/tr.html';

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

const PrivacyContent = ({ currentTheme }: { currentTheme: any }) => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(PRIVACY_HTML_URL);
        if (!res.ok) {
          throw new Error('Response not ok');
        }

        const text = await res.text();
        if (mounted) {
          setHtml(text);
        }
      } catch {
        if (mounted) {
          setError(
            'Gizlilik metni yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          );
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
  }, []);

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
            Gizlilik metni yükleniyor...
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

const PrivacyScreen: React.FC<Props> = ({
  navigation,
  onAccept,
  nextRoute,
}) => {
  const { currentTheme } = useTheme();

  const handleAccept = useCallback(async () => {
    await AsyncStorage.setItem(PRIVACY_KEY, 'true');
    onAccept();
    navigation.replace(nextRoute ?? RootRoutes.Main);
  }, [navigation, nextRoute, onAccept]);

  const handleDecline = useCallback(() => {
    Alert.alert(
      'Gizlilik Politikası',
      'Gizlilik politikasını kabul etmeden uygulamayı kullanamazsınız.',
      [
        {
          text: 'Kapat',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: currentTheme.textColor }]}>
          Gizlilik Politikası ve Kullanım Şartları
        </Text>
      </View>

      {/*  👇 sadece içerik kısmı artık GitHub HTML'den geliyor */}
      <PrivacyContent currentTheme={currentTheme} />

      <View style={styles.actions}>
        <ActionButton
          label="Kabul Etmiyorum"
          onPress={handleDecline}
          type="secondary"
          color={currentTheme.primary}
          textColor={currentTheme.backgroundColor}
          borderColor={currentTheme.primary}
          style={styles.actionSpacing}
        />
        <ActionButton
          label="Kabul Ediyorum"
          onPress={handleAccept}
          color={currentTheme.primary}
          textColor={currentTheme.backgroundColor}
          borderColor={currentTheme.primary}
          style={styles.actionSpacing}
        />
      </View>
    </View>
  );
};

/* ---------------------------------- Styles --------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
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
});

export default PrivacyScreen;
export { PRIVACY_KEY };
