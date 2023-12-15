import React, {useState} from 'react';
import {ScreenViewContainer, SegmentedControl} from '../../../libs/components';
import {
  MissedTrackingLanguageConstants,
  MissedTrackingTabKeys,
} from '../../../libs/common/constants';
import {FastingForm, PrayerForm} from '../../../libs/core/sections';
import {Translate} from '../../../libs/core/helpers';
import {horizontalScale} from '../../../libs/core/utils';
import {ScrollView} from 'react-native';

const MissedTracking = () => {
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {selectedTab === MissedTrackingTabKeys.Prayer && <PrayerForm />}
        {selectedTab === MissedTrackingTabKeys.Fasting && <FastingForm />}
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default MissedTracking;
