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
  useEffect(() => {
    console.log(dhikr.dhikrs[0].dhikrList);
  }, []);
  const tabs = [
    {
      key: DhikrTabKeys.All,
      value: Translate(DhikrLanguageConstants.AllDhikr),
    },
    {
      key: DhikrTabKeys.Prayer,
      value: Translate(DhikrLanguageConstants.PrayerDhikr),
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
      <ScrollView showsVerticalScrollIndicator={false} style={{marginHorizontal: 25, marginTop: 20}}>
        {selectedTab === DhikrTabKeys.All && <AllDhikr />}
        {selectedTab === DhikrTabKeys.Prayer && <PrayerDhikr />}
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default Dhikr;
