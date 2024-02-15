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
  StringConstants,
} from '../../../../common/constants';
import {Translate} from '../../../helpers';
import {
  calculateDaysBetweenDates,
  calculateMonthsBetweenDates,
} from '../../../utils';
import {useDispatch, useSelector} from 'react-redux';
import {createMissedPrayer} from '../../../../redux/reducers/MissedPrayer';

const PrayerForm = () => {
  const dispatch = useDispatch();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      gender: StringConstants.EMPTY_STRING,
      date: new Date(),
      entryIntoPubertyAge: undefined,
      prayersPerformedCount: undefined,
    },
  });
  const onSubmit = data => {
    let errorMessage: string = StringConstants.EMPTY_STRING;
    setSubmitErrorMessages(StringConstants.EMPTY_STRING);
    const prayerCalculatorDate = new Date(data.date);
    if (data.date instanceof Date) {
      prayerCalculatorDate.setFullYear(
        prayerCalculatorDate.getFullYear() + Number(data.entryIntoPubertyAge),
      );
      if (new Date(data.date) > new Date()) {
        errorMessage = 'Doğum tarihi bugünden büyük olamaz.';
      } else if (new Date() < prayerCalculatorDate) {
        errorMessage =
          'Doğum tarihi ve buluğ çağına giriş yaşının toplamları bugünden büyük olamaz!';
      } else if (
        !isNullOrEmptyString(data.prayersPerformedCount) &&
        isNumber(data.prayersPerformedCount)
      ) {
        prayerCalculatorDate.setDate(
          prayerCalculatorDate.getDate() + Number(data.prayersPerformedCount),
        );
        if (new Date() < prayerCalculatorDate) {
          errorMessage =
            'Doğum tarihi, kılınan namaz sayısı ve buluğ çağına giriş yaşının toplamları bugünden büyük olamaz!';
        }
      }
    } else {
      errorMessage = 'Lütfen doğum tarihinizi kontrol ediniz.';
    }

    if (!isNullOrEmptyString(errorMessage)) {
      return setSubmitErrorMessages(errorMessage);
    }
    let missedPrayerCount = calculateDaysBetweenDates(
      new Date(),
      prayerCalculatorDate,
    );
    if (data.gender === Gender.Female) {
      const totalMonths = calculateMonthsBetweenDates(
        prayerCalculatorDate,
        new Date(),
      );
      missedPrayerCount -= Math.abs(totalMonths) * 6;
    }
    if (missedPrayerCount < 0) {
      setSubmitErrorMessages(
        'Kılınmayan namaz sayısı hesaplanamadı. Lütfen bilgilerinizi kontrol ediniz.',
      );
    } else if (missedPrayerCount === 0) {
      setSubmitErrorMessages(
        'Tebrikler! Kılınmayan namaz sayınız bulunmamaktadır.',
      );
    } else {
      // TODO: Burada hesaplanan kılınmayan namaz sayısı ile ilgili bir işlem yapılacak.
      dispatch(createMissedPrayer(missedPrayerCount));
    }
  };

  useEffect(() => {
    console.log('errors', errors);
  }, []);
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [submitErrorMessages, setSubmitErrorMessages] = useState<string>(
    StringConstants.EMPTY_STRING,
  );
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
        paddingVertical={15}
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
            name="gender"
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
                <Text style={{color: currentTheme.textColor}}>
                  {date?.toLocaleDateString('tr-TR')}
                </Text>
              </TouchableOpacity>
            }
            render={({field: {onChange, value}}) => {
              return (
                <>
                  {show && (
                    <DateTimePicker
                      themeVariant={applicationTheme.theme}
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
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 1, 1)}
                    />
                  )}
                </>
              );
            }}
          />,
          <FormControl
            rules={{
              required: true,
              validate: value => {
                if (value && value < 8) {
                  return false;
                }
                return true;
              },
            }}
            requiredMessage={Translate(
              GeneralLanguageConstants.RequiredMessage,
            )}
            validateMessage={Translate(
              MissedPrayerFormLanguageConstants.EntryIntoPubertyAgeValidateMessage,
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
                    {
                      backgroundColor: currentTheme.inputBackgroundColor,
                      color: currentTheme.textColor,
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={val => {
                    if (isNullOrEmptyString(val) || isNumber(val)) {
                      if (Number(val) > 18) {
                        return onChange(18);
                      } else if (Number(val) === 0) {
                        return onChange(undefined);
                      } else {
                        onChange(val);
                      }
                    }
                  }}
                  value={(value || StringConstants.EMPTY_STRING).toString()}
                  keyboardType="numeric"
                  placeholder="12"
                  placeholderTextColor={'#ccc'}
                  autoComplete="off"
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
                    {
                      backgroundColor: currentTheme.inputBackgroundColor,
                      color: currentTheme.textColor,
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={val => {
                    if (isNullOrEmptyString(val) || isNumber(val)) {
                      if (Number(val) > 99999) {
                        return onChange(99999);
                      } else {
                        onChange(val);
                      }
                    }
                  }}
                  value={(value || StringConstants.EMPTY_STRING).toString()}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={currentTheme.gray}
                  autoComplete="off"
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
      <Text style={{color: 'red', marginLeft: 25, marginTop: 20}}>
        {submitErrorMessages}
      </Text>
    </>
  );
};

export default PrayerForm;
