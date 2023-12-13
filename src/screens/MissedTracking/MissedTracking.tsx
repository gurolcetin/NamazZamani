import React, {useState} from 'react';
import {
  CardView,
  ScreenViewContainer,
  TabButtonGroup,
} from '../../../libs/components';
import {
  MissedTrackingLanguageConstants,
  MissedTrackingTabKeys,
} from '../../../libs/common/constants';
import {FastingForm, PrayerForm} from '../../../libs/core/sections';
import {Translate} from '../../../libs/core/helpers';

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
      <CardView>
        <TabButtonGroup tabs={tabs} onTabChange={onTabChange} />
      </CardView>
      {selectedTab === MissedTrackingTabKeys.Prayer && <PrayerForm />}
      {selectedTab === MissedTrackingTabKeys.Fasting && <FastingForm />}
    </ScreenViewContainer>
  );
};

export default MissedTracking;
