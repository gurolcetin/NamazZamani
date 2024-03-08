import React, {useEffect, useState} from 'react';
import {
  CircleProgressBar,
  ScreenViewContainer,
  SegmentedControl,
} from '../../../libs/components';
import {ScrollView} from 'react-native';
import {
  DhikrLanguageConstants,
  DhikrTabKeys,
} from '../../../libs/common/constants';
import {Translate} from '../../../libs/core/helpers';
import {horizontalScale} from '../../../libs/core/utils';
import {useSelector} from 'react-redux';
import {AllDhikr, PrayerDhikr} from '../../../libs/core/sections';

const Dhikr = () => {
  const dhikr = useSelector((state: any) => state.dhikr);
  useEffect(() => {}, []);
  const tabs = [
    {
      key: DhikrTabKeys.Prayer,
      value: Translate(DhikrLanguageConstants.PrayerDhikr),
    },
    {
      key: DhikrTabKeys.All,
      value: Translate(DhikrLanguageConstants.AllDhikr),
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
        {selectedTab === DhikrTabKeys.All && <AllDhikr />}
        {selectedTab === DhikrTabKeys.Prayer && <PrayerDhikr />}
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default Dhikr;
