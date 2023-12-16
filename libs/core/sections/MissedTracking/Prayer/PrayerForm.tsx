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
            label="Cinsiyet"
            render={({field: {onChange, onBlur, value}}) => (
              <>
                <TextInput
                  style={{
                    textAlign: 'right',
                    flex: 0.1,
                    backgroundColor: '#ccc',
                    borderRadius: 5,
                    fontSize: 16,
                  }}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="Giriniz"
                  placeholderTextColor={'#ccc'}
                />
              </>
            )}
          />,
          <FormControl
            rules={{
              required: true,
            }}
            requiredMessage="Bu alan zorunludur."
            control={control}
            name="size"
            label="Doğum Tarihi"
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
                  placeholderTextColor={'#ccc'}
                />
              </>
            )}
          />,
          <FormControl
            rules={{
              required: true,
            }}
            requiredMessage="Bu alan zorunludur."
            control={control}
            name="size"
            label="Buluğ Çağına Giriş Yaşı"
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
                  placeholderTextColor={'#ccc'}
                />
              </>
            )}
          />,
          <FormControl
            rules={{
              required: true,
            }}
            requiredMessage="Bu alan zorunludur."
            control={control}
            name="size"
            label="Kılınan Namaz Sayısı"
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
                  placeholderTextColor={'#ccc'}
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
