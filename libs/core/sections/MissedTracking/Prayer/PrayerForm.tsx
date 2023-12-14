import React from 'react';
import {CardView, FormInput, TableView} from '../../../../components';
import {Text} from 'react-native';

const PrayerForm = () => {
  return (
    <TableView
      childrenList={[
        <FormInput label="asd">
          <Text>Prayer</Text>
        </FormInput>,
        <FormInput label="asd">
          <Text>Prayer</Text>
        </FormInput>,
      ]}
    />
  );
};

export default PrayerForm;
