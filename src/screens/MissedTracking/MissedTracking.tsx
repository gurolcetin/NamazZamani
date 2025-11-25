import React, { useEffect, useState } from 'react';
import {
  ScreenViewContainer,
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
import { horizontalScale } from '../../../libs/core/utils';
import { ScrollView } from 'react-native';
import { globalStyle } from '../../../libs/styles';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

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

  return (
    <ScreenViewContainer>
      <SegmentedControl
        tabs={tabs}
        onTabChange={onTabChange}
        marginHorizontal={horizontalScale(20)}
        marginTop={horizontalScale(15)}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={globalStyle.marginBottomScrollView}
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
    </ScreenViewContainer>
  );
};

export default MissedTracking;
