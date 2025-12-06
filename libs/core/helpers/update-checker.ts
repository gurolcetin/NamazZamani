import {Alert, Linking, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import i18next from 'i18next';

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

const getFallbackOptionalMessage = (): UpdateMessage => ({
  title: i18next.t('updates.optional.title'),
  body: i18next.t('updates.optional.body'),
  confirm: i18next.t('updates.optional.confirm'),
  cancel: i18next.t('updates.optional.cancel'),
});

const getFallbackForceMessage = (): UpdateMessage => ({
  title: i18next.t('updates.force.title'),
  body: i18next.t('updates.force.body'),
  confirm: i18next.t('updates.force.confirm'),
});

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
    console.warn(i18next.t('updates.storeOpenError'), error);
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
  const message = mergeMessage(
    decision.message,
    getFallbackOptionalMessage(),
  );

  Alert.alert(
    message.title,
    message.body,
    [
      {
        text: message.cancel || i18next.t('updates.optional.cancel'),
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
  const message = mergeMessage(
    decision.message,
    getFallbackForceMessage(),
    false,
  );

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
  } catch {
    return true;
  }
};
