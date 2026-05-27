/**
 * Tek ayar noktası:
 * false => Dev build'de dev araçlarını ve reklamları kapatır.
 * true  => Dev build'de dev araçlarını ve reklamları açar.
 */
export const ENABLE_DEV_FEATURES_AND_ADS = true;

const IS_NATIVE_DEV_BUILD = __DEV__;

export const IS_DEV_FEATURES_ENABLED =
  IS_NATIVE_DEV_BUILD && ENABLE_DEV_FEATURES_AND_ADS;

export const IS_ADS_ENABLED =
  !IS_NATIVE_DEV_BUILD || ENABLE_DEV_FEATURES_AND_ADS;

export const SHOULD_USE_TEST_AD_UNITS = IS_NATIVE_DEV_BUILD;
