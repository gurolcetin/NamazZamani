import React, { useEffect, useState } from 'react';
import {
  BottomTabScreenViewContainer,
  SegmentedControl,
} from '../../../libs/components';
import {
  MissedTrackingLanguageConstants,
  MissedTrackingTabKeys,
} from '../../../libs/common/constants';
import {
  CalculatedMissedPrayer,
  FastingForm,
  PrayerForm,
  CalculatedMissedFasting,
} from '../../../libs/core/sections';
import { ScrollView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../libs/redux/store';
import { FontScaleOption } from '../../../libs/common/enums';
import { getFontScaleMultiplier } from '../../../libs/core/helpers';

const MissedTracking = () => {
  const { t } = useTranslation();
  const missedPrayer = useSelector((state: any) => state.missedPrayer);
  const missedFasting = useSelector((state: any) => state.missedFasting);
  const [isMissedPrayerCalculated, setIsMissedPrayerCalculated] =
    useState(false);
  const [isMissedFastingCalculated, setIsMissedFastingCalculated] =
    useState(false);
  useEffect(() => {
    setIsMissedPrayerCalculated(missedPrayer.isMissedPrayerCalculated);
    setIsMissedFastingCalculated(missedFasting.isMissedFastingCalculated);
  }, [
    missedFasting.isMissedFastingCalculated,
    missedPrayer.isMissedPrayerCalculated,
  ]);
  useEffect(() => {
    setIsMissedPrayerCalculated(missedPrayer.isMissedPrayerCalculated);
  }, [missedPrayer.isMissedPrayerCalculated]);
  useEffect(() => {
    setIsMissedFastingCalculated(missedFasting.isMissedFastingCalculated);
  }, [missedFasting.isMissedFastingCalculated]);
  const tabs = [
    {
      key: MissedTrackingTabKeys.Prayer,
      value: t(MissedTrackingLanguageConstants.MissedPrayer.key),
    },
    {
      key: MissedTrackingTabKeys.Fasting,
      value: t(MissedTrackingLanguageConstants.MissedFasting.key),
    },
  ];
  const [selectedTab, setSelectedTab] = useState<string | number>(tabs[0].key);
  const onTabChange = (key: string | number) => {
    setSelectedTab(key);
  };

  const fontScalePreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);

  return (
    <BottomTabScreenViewContainer>
      <SegmentedControl
        tabs={tabs}
        onTabChange={onTabChange}
        marginHorizontal={20}
        marginTop={15}
        fontScaleMultiplier={fontScaleMultiplier}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedTab === MissedTrackingTabKeys.Prayer &&
          (!isMissedPrayerCalculated ? (
            <PrayerForm />
          ) : (
            <CalculatedMissedPrayer />
          ))}
        {selectedTab === MissedTrackingTabKeys.Fasting &&
          (!isMissedFastingCalculated ? (
            <FastingForm />
          ) : (
            <CalculatedMissedFasting />
          ))}
      </ScrollView>
    </BottomTabScreenViewContainer>
  );
};

export default MissedTracking;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 70,
  },
});
