import React, {useEffect, useState} from 'react';
import {ScreenViewContainer, SegmentedControl} from '../../../libs/components';
import {
  MissedTrackingLanguageConstants,
  MissedTrackingTabKeys,
} from '../../../libs/common/constants';
import {
  CalculatedMissedPrayer,
  FastingForm,
  PrayerForm,
} from '../../../libs/core/sections';
import {Translate} from '../../../libs/core/helpers';
import {horizontalScale} from '../../../libs/core/utils';
import {ScrollView} from 'react-native';
import {globalStyle} from '../../../libs/styles';
import {useSelector} from 'react-redux';
import {Text} from 'react-native';
const MissedTracking = () => {
  const missedPrayer = useSelector((state: any) => state.missedPrayer);
  const [isMissedPrayerCalculated, setIsMissedPrayerCalculated] =
    useState(false);
  useEffect(() => {
    console.log('missedPrayer created', missedPrayer.isMissedPrayerCalculated);
    setIsMissedPrayerCalculated(missedPrayer.isMissedPrayerCalculated);
  }, []);
  useEffect(() => {
    console.log('missedPrayer created', missedPrayer.isMissedPrayerCalculated);
    setIsMissedPrayerCalculated(missedPrayer.isMissedPrayerCalculated);
  }, [missedPrayer.isMissedPrayerCalculated]);
  const tabs = [
    {
      key: MissedTrackingTabKeys.Prayer,
      value: Translate(MissedTrackingLanguageConstants.MissedPrayer),
    },
    {
      key: MissedTrackingTabKeys.Fasting,
      value: Translate(MissedTrackingLanguageConstants.MissedFasting),
    },
  ];
  const [selectedTab, setSelectedTab] = useState(tabs[0].key);
  const onTabChange = index => {
    setSelectedTab(index);
  };

  return (
    <ScreenViewContainer>
      <SegmentedControl
        tabs={tabs}
        onTabChange={onTabChange}
        marginHorizontal={horizontalScale(20)}
        marginTop={horizontalScale(20)}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={globalStyle.marginBottomScrollView}>
        {selectedTab === MissedTrackingTabKeys.Prayer &&
          (!isMissedPrayerCalculated ? (
            <PrayerForm />
          ) : (
            <CalculatedMissedPrayer />
          ))}
        {selectedTab === MissedTrackingTabKeys.Fasting && <FastingForm />}
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default MissedTracking;
