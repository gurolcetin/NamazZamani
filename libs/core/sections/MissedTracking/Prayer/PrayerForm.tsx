import React, {useEffect} from 'react';
import {SubmitButton, TableView} from '../../../../components';
import {Button, TextInput, Text, TouchableOpacity, View} from 'react-native';
import {useForm} from 'react-hook-form';
import {FormControl} from '../../../../components/FormControl/FormControl';
import {verticalScale} from '../../../utils';

const PrayerForm = () => {
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      size: '',
    },
  });
  const onSubmit = data => {
    console.log(data);
  };

  useEffect(() => {
    console.log('errors', errors);
  }, []);

  return (
    <>
      <TableView
        dividerSliceCount={2}
        childrenList={[
          <FormControl
            rules={{
              required: true,
            }}
            requiredMessage="Bu alan zorunludur."
            control={control}
            name="size"
            label="Deneme"
            render={({field: {onChange, onBlur, value}}) => (
              <>
                <TextInput
                  style={{
                    flex: 0.7,
                    textAlign: 'right',
                  }}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="Giriniz"
                  placeholderTextColor={'#000'}
                />
              </>
            )}
          />,
          <SubmitButton onSubmit={handleSubmit(onSubmit)} label={'HESAPLA'} />,
        ]}
      />
    </>
  );
};

export default PrayerForm;
