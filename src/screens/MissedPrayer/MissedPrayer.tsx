import React from 'react';
import {
  CardView,
  ScreenViewContainer,
  TabButtonGroup,
} from '../../../libs/components';

const tabs = [
  {key: 0, value: 'Namaz Takibi'},
  {key: 1, value: 'Oruç Takibi'},
  {key: 2, value: 'My Account'},
];

const MissedPrayer = () => {
  return (
    <ScreenViewContainer>
      <CardView>
        <TabButtonGroup tabs={tabs} />
      </CardView>
    </ScreenViewContainer>
  );
};

export default MissedPrayer;
