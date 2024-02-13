import React, {useEffect, useState} from 'react';
import {RadioButton, SubmitButton, TableView} from '../../../../components';
import {TextInput, Text, TouchableOpacity} from 'react-native';
import {useForm} from 'react-hook-form';
import {FormControl} from '../../../../components/FormControl/FormControl';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from './style';
import {isNullOrEmptyString, isNumber} from 'typescript-util-functions';
import {useTheme} from '../../../providers';
import {
  Gender,
  GeneralLanguageConstants,
  MissedPrayerFormLanguageConstants,
} from '../../../../common/constants';
import {Translate} from '../../../helpers';

const PrayerForm = () => {
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      size: '',
      date: new Date(),
      prayersPerformedCount: undefined,
      entryIntoPubertyAge: undefined,
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
  const {currentTheme} = useTheme();
  const maleLabel = Translate(GeneralLanguageConstants.Male);
  const femaleLabel = Translate(GeneralLanguageConstants.Female);
  const calculateLabel = Translate(GeneralLanguageConstants.Calculate);
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
            requiredMessage={Translate(
              GeneralLanguageConstants.RequiredMessage,
            )}
            control={control}
            name="size"
            label={Translate(MissedPrayerFormLanguageConstants.Gender)}
            render={({field: {onChange, onBlur, value}}) => (
              <RadioButton
                radioButtonList={[
                  {
                    value: Gender.Male,
                    label: maleLabel,
                  },
                  {
                    value: Gender.Female,
                    label: femaleLabel,
                  },
                ]}
                selectedValue={value}
                onValueChange={onChange}
                selectedItemBackgroundColor="#ccc"
                selectedItemTextColor="#000"
              />
            )}
          />,
          <FormControl
            rules={{
              required: true,
            }}
            requiredMessage={Translate(
              GeneralLanguageConstants.RequiredMessage,
            )}
            control={control}
            name="date"
            label={Translate(MissedPrayerFormLanguageConstants.BirthDate)}
            extra={
              <TouchableOpacity
                style={[
                  styles.dateTimePicker,
                  {backgroundColor: currentTheme.inputBackgroundColor},
                ]}
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
                      accentColor={currentTheme.primary}
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
            requiredMessage={Translate(
              GeneralLanguageConstants.RequiredMessage,
            )}
            control={control}
            name="entryIntoPubertyAge"
            label={Translate(
              MissedPrayerFormLanguageConstants.EntryIntoPubertyAge,
            )}
            labelFontSize={15}
            render={({field: {onChange, onBlur, value}}) => (
              <>
                <TextInput
                  style={[
                    styles.smallInput,
                    {backgroundColor: currentTheme.inputBackgroundColor},
                  ]}
                  onBlur={onBlur}
                  onChangeText={val => {
                    if (isNullOrEmptyString(val) || isNumber(val)) {
                      console.log('val2', val);
                      if (Number(val) > 18) {
                        return onChange(18);
                      } else {
                        onChange(val);
                      }
                    }
                  }}
                  value={(value || '').toString()}
                  keyboardType="numeric"
                  placeholder="12"
                  placeholderTextColor={'#ccc'}
                />
              </>
            )}
          />,
          <FormControl
            rules={{
              required: false,
            }}
            requiredMessage={Translate(
              GeneralLanguageConstants.RequiredMessage,
            )}
            control={control}
            name="prayersPerformedCount"
            label={Translate(
              MissedPrayerFormLanguageConstants.NumberofDaysofPrayer,
            )}
            labelFontSize={15}
            render={({field: {onChange, onBlur, value}}) => (
              <>
                <TextInput
                  style={[
                    styles.smallInput,
                    styles.flex05,
                    {backgroundColor: currentTheme.inputBackgroundColor},
                  ]}
                  onBlur={onBlur}
                  onChangeText={val => {
                    if (isNullOrEmptyString(val) || isNumber(val)) {
                      console.log('val1', val);
                      if (Number(val) > 99999) {
                        return onChange(99999);
                      } else {
                        onChange(val);
                      }
                    }
                  }}
                  value={(value || '').toString()}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={currentTheme.gray}
                />
              </>
            )}
          />,
          <SubmitButton
            onSubmit={handleSubmit(onSubmit)}
            label={calculateLabel}
          />,
        ]}
      />
    </>
  );
};

export default PrayerForm;
