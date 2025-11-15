// src/utils/updateChecker.ts
import { Alert, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const VERSION_CONFIG_URL =
  'https://gurolcetin.github.io/namaz-zamani-public-files/mobile-version.json';

type VersionConfig = {
  minSupportedVersion: string;
  latestVersion?: string;
  forceUpdate?: boolean;
  storeUrlAndroid?: string;
  storeUrliOS?: string;
};

const compareVersions = (v1: string, v2: string) => {
  const a = v1.split('.').map(Number);
  const b = v2.split('.').map(Number);
  const maxLen = Math.max(a.length, b.length);

  for (let i = 0; i < maxLen; i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;

    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
};

export const checkForceUpdate = async (): Promise<boolean> => {
  try {
    const currentVersion = DeviceInfo.getVersion(); // Örn: "1.0.2"

    const res = await fetch(VERSION_CONFIG_URL);
    const config: VersionConfig = await res.json();

    const { minSupportedVersion, forceUpdate, storeUrlAndroid, storeUrliOS } =
      config;

    const compareResult = compareVersions(currentVersion, minSupportedVersion);

    if (forceUpdate && compareResult < 0) {
      const storeUrl =
        Platform.OS === 'android' ? storeUrlAndroid : storeUrliOS;

      Alert.alert(
        'Güncelleme gerekli',
        'Uygulamayı kullanmaya devam etmek için lütfen son sürüme güncelleyin.',
        [
          {
            text: 'Güncelle',
            onPress: () => {
              if (storeUrl) {
                Linking.openURL(storeUrl);
              }
            },
          },
        ],
        { cancelable: false },
      );

      return false; // uygulama devam etmesin
    }

    return true; // güncel, devam edebilir
  } catch (e) {
    console.log('Force update kontrolü başarısız:', e);
    // İstersen burada da "devam et" diyebilirsin
    return true;
  }
};
