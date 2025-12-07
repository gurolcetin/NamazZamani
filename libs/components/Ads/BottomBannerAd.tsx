import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BOTTOM_TAB_BANNER_AD_UNIT_ID } from '../../common/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomBannerAdProps = {
  containerStyle?: StyleProp<ViewStyle>;
};

const BottomBannerAd: React.FC<BottomBannerAdProps> = ({ containerStyle }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
        containerStyle,
      ]}
    >
      <BannerAd
        unitId={BOTTOM_TAB_BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomBannerAd;
