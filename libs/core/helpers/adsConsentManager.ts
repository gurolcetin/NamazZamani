import { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, AdsConsentDebugGeography } from 'react-native-google-mobile-ads';

let _personalizedAdsAllowed: boolean = false;
let _privacyOptionsRequired: boolean = false;

/**
 * UMP consent akışını çalıştırır.
 * GDPR bölgesindeyse form gösterir, değilse direkt kişiselleştirilmiş reklama izin verir.
 * mobileAds().initialize() çağrılmadan ÖNCE çalıştırılmalıdır.
 */
export async function gatherAdsConsent(
  testDeviceIdentifiers?: string[],
  debugEEA: boolean = false,
): Promise<void> {
  try {
    try {
      await AdsConsent.gatherConsent(
        testDeviceIdentifiers ? {
          testDeviceIdentifiers,
          debugGeography: debugEEA ? AdsConsentDebugGeography.EEA : AdsConsentDebugGeography.DISABLED,
        } : {},
      );
    } catch (consentError) {
      // UMP formu AdMob'da yapılandırılmamış olabilir — devam et, getGdprApplies ile kontrol et
      console.warn('AdsConsent.gatherConsent failed:', consentError);
    }

    const gdprApplies = await AdsConsent.getGdprApplies();
    if (!gdprApplies) {
      // GDPR bölgesi dışında (TR vb.) — kişiselleştirilmiş reklamlara izin ver
      _personalizedAdsAllowed = true;
      _privacyOptionsRequired = false;
      return;
    }

    // GDPR bölgesi — kullanıcı form seçimine göre belirle
    const choices = await AdsConsent.getUserChoices();
    _personalizedAdsAllowed = choices.selectPersonalisedAds;

    // Gizlilik tercih butonu gerekli mi? (EEA + ABD eyaletlerini kapsar)
    const consentInfo = await AdsConsent.getConsentInfo();
    _privacyOptionsRequired =
      consentInfo.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch (error) {
    console.warn('AdsConsent gather failed:', error);
    _personalizedAdsAllowed = false;
  }
}

/**
 * Kişiselleştirilmiş reklamlara izin verilip verilmediğini döner.
 * gatherAdsConsent() tamamlandıktan sonra okunmalıdır.
 */
export function isPersonalizedAdsAllowed(): boolean {
  return _personalizedAdsAllowed;
}

export function isPrivacyOptionsRequired(): boolean {
  return _privacyOptionsRequired;
}
