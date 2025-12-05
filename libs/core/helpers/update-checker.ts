import {Alert, Linking, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';

import {
  evaluateUpdate,
  UpdateMessage,
  UpdateDecision,
  RemoteConfig,
} from './app-update-evaluator';
import {GetDeviceLang} from '../utils/i18next.languageDetector';

const VERSION_CONFIG_URL =
  'https://gurolcetin.github.io/namaz-zamani-public-files/mobile-version.json';

const buildCacheBustedUrl = () => {
  const timestamp = Date.now();
  const separator = VERSION_CONFIG_URL.includes('?') ? '&' : '?';
  return `${VERSION_CONFIG_URL}${separator}t=${timestamp}`;
};

const FALLBACK_OPTIONAL_MESSAGE: UpdateMessage = {
  title: 'Yeni sürüm mevcut',
  body: 'En iyi deneyim için uygulamayı güncellemenizi öneriyoruz.',
  confirm: 'Güncelle',
  cancel: 'Sonra',
};

const FALLBACK_FORCE_MESSAGE: UpdateMessage = {
  title: 'Güncelleme gerekli',
  body: 'Bu sürüm artık desteklenmiyor. Lütfen mağazadan güncelleyin.',
  confirm: 'Güncelle',
};

const getLanguageCode = () => {
  try {
    return GetDeviceLang() || 'en';
  } catch {
    return 'en';
  }
};

const openStoreLink = (storeUrl?: string) => {
  if (!storeUrl) {
    return;
  }

  Linking.openURL(storeUrl).catch(error => {
    console.warn('Store bağlantısı açılamadı:', error);
  });
};

const mergeMessage = (
  message: UpdateMessage | undefined,
  fallback: UpdateMessage,
  includeCancel = true,
): UpdateMessage => {
  const merged: UpdateMessage = {
    title: message?.title || fallback.title,
    body: message?.body || fallback.body,
    confirm: message?.confirm || fallback.confirm,
  };

  if (includeCancel) {
    const cancelText = message?.cancel || fallback.cancel;
    if (cancelText) {
      merged.cancel = cancelText;
    }
  }

  return merged;
};

const showOptionalAlert = (decision: UpdateDecision) => {
  const message = mergeMessage(decision.message, FALLBACK_OPTIONAL_MESSAGE);

  Alert.alert(
    message.title,
    message.body,
    [
      {
        text: message.cancel || 'Sonra',
        style: 'cancel',
      },
      {
        text: message.confirm,
        onPress: () => openStoreLink(decision.storeUrl),
      },
    ],
    {cancelable: true},
  );
};

const showForceAlert = (decision: UpdateDecision) => {
  const message = mergeMessage(decision.message, FALLBACK_FORCE_MESSAGE, false);

  Alert.alert(
    message.title,
    message.body,
    [
      {
        text: message.confirm,
        onPress: () => openStoreLink(decision.storeUrl),
      },
    ],
    {cancelable: false},
  );
};

const stripJsonComments = (content: string) =>
  content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

export const checkForceUpdate = async (): Promise<boolean> => {
  try {
    const currentVersion = DeviceInfo.getVersion();
    const languageCode = getLanguageCode();

    const response = await fetch(buildCacheBustedUrl(), {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!response.ok) {
      throw new Error(`Remote config fetch failed: ${response.status}`);
    }

    const configText = await response.text();
    const sanitizedConfig = stripJsonComments(configText);
    const remoteConfig: RemoteConfig = JSON.parse(sanitizedConfig);

    const decision = evaluateUpdate(
      currentVersion,
      languageCode,
      Platform.OS === 'ios' ? 'ios' : 'android',
      remoteConfig,
    );

    if (decision.type === 'none') {
      return true;
    }

    if (decision.type === 'optional') {
      showOptionalAlert(decision);
      return true;
    }

    showForceAlert(decision);
    return false;
  } catch (error) {
    console.log('Force update kontrolü başarısız:', error);
    return true;
  }
};
