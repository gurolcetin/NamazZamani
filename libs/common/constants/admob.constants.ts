import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';
import { SHOULD_USE_TEST_AD_UNITS } from './runtime.constants';

const IOS_BOTTOM_TAB_BANNER = 'ca-app-pub-1664398990145686/8115609373';
const ANDROID_BOTTOM_TAB_BANNER = 'ca-app-pub-1664398990145686/1470309976';

export const BOTTOM_TAB_BANNER_AD_UNIT_ID =
  SHOULD_USE_TEST_AD_UNITS
    ? TestIds.BANNER
    : Platform.select({
        ios: IOS_BOTTOM_TAB_BANNER,
        android: ANDROID_BOTTOM_TAB_BANNER,
        default: TestIds.BANNER,
      }) || TestIds.BANNER;
