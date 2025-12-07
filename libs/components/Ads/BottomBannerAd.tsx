import React, { useState } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BOTTOM_TAB_BANNER_AD_UNIT_ID } from '../../common/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomBannerAdProps = {
  containerStyle?: StyleProp<ViewStyle>;
};

const BottomBannerAd: React.FC<BottomBannerAdProps> = ({ containerStyle }) => {
  const insets = useSafeAreaInsets();
  const [isLoaded, setIsLoaded] = useState(false);
  const spacingStyle = isLoaded
    ? {
        paddingTop: 16,
        paddingBottom: 16 + Math.max(insets.bottom, 8),
      }
    : styles.hidden;

  return (
    <View
      style={[
        styles.container,
        spacingStyle,
        containerStyle,
      ]}
    >
      <BannerAd
        unitId={BOTTOM_TAB_BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => setIsLoaded(true)}
        onAdFailedToLoad={() => setIsLoaded(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: {
    paddingTop: 0,
    paddingBottom: 0,
    height: 0,
    overflow: 'hidden',
  },
});

export default BottomBannerAd;
