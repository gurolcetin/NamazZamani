import React from 'react';
import {CircleProgressBar, ScreenViewContainer} from '../../../libs/components';
import {ScrollView} from 'react-native';

const Dhikr = () => {
  return (
    <ScreenViewContainer>
      <ScrollView>
        <CircleProgressBar key={"1"} progress={50} />
        <CircleProgressBar key={"2"} progress={12} />
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default Dhikr;
