import React, { useState } from 'react';
import {
  BottomTabScreenViewContainer,
  SegmentedControl,
} from '../../../libs/components';
import { ScrollView, StyleSheet } from 'react-native';
import {
  DhikrLanguageConstants,
  DhikrTabKeys,
} from '../../../libs/common/constants';
import { useTranslation } from 'react-i18next';
import { AllDhikr, PrayerDhikr } from '../../../libs/core/sections';
import { useSelector } from 'react-redux';
import { RootState } from '../../../libs/redux/store';
import { FontScaleOption } from '../../../libs/common/enums';
import { getFontScaleMultiplier } from '../../../libs/core/helpers';

const Dhikr = () => {
  const { t } = useTranslation();
  const tabs = [
    {
      key: DhikrTabKeys.Prayer,
      value: t(DhikrLanguageConstants.PrayerDhikr.key),
    },
    {
      key: DhikrTabKeys.All,
      value: t(DhikrLanguageConstants.AllDhikr.key),
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
        {selectedTab === DhikrTabKeys.All && <AllDhikr />}
        {selectedTab === DhikrTabKeys.Prayer && <PrayerDhikr />}
      </ScrollView>
    </BottomTabScreenViewContainer>
  );
};

export default Dhikr;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 70,
  },
});
