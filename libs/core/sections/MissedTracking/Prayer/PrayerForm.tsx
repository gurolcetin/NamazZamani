import React, {useEffect, useState} from 'react';
import {SubmitButton, TableView} from '../../../../components';
import {
  Button,
  TextInput,
  Text,
  Touchable,
  TouchableOpacity,
} from 'react-native';
import {useForm} from 'react-hook-form';
import {FormControl} from '../../../../components/FormControl/FormControl';
import DateTimePicker from '@react-native-community/datetimepicker';

const PrayerForm = () => {
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      size: '',
      date: new Date(),
    },
  });
  const onSubmit = data => {
    console.log(data);
  };

  useEffect(() => {
    console.log('errors', errors);
  }, []);
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const showHideDatepicker = () => {
    setShow(!show);
  };

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
            name="date"
            label="Doğum Tarihi"
            extra={
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ccc',
                  borderRadius: 5,
                  padding: 8,
                }}
                onPress={showHideDatepicker}>
                <Text>{date?.toLocaleDateString()}</Text>
              </TouchableOpacity>
            }
            render={({field: {onChange, value}}) => {
              return (
                <>
                  {show && (
                    <DateTimePicker
                      themeVariant="light"
                      testID="dateTimePicker"
                      value={value}
                      mode={'date' as any}
                      onChange={(event, selectedDate) => {
                        const currentDate = selectedDate ?? new Date();
                        setDate(currentDate);
                        onChange(currentDate);
                      }}
                      display="inline"
                    />
                  )}
                </>
              );
            }}
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
