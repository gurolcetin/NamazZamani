import React, {useEffect, useState} from 'react';
import {
  ErrorView,
  RadioButton,
  SubmitButton,
  TableView,
} from '../../../../components';
import {TextInput, Text, TouchableOpacity} from 'react-native';
import {useForm} from 'react-hook-form';
import {FormControl} from '../../../../components/FormControl/FormControl';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from './style';
import {isNullOrEmptyString, isNumber} from 'typescript-util-functions';
import {useTheme} from '../../../providers';
import {
  CalculatedMissedFastingLanguageConstants,
  FastingFormLanguageConstants,
  Gender,
  GeneralLanguageConstants,
  LanguageLocaleKeys,
  LanguagePrefix,
  MissedPrayerFormLanguageConstants,
  MissedTrackingLanguageConstants,
  StringConstants,
} from '../../../../common/constants';
import {Translate, calculateRamadanCountBetweenDates} from '../../../helpers';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {createMissedFasting} from '../../../../redux/reducers/MissedFasting';

const FastingForm = () => {
  const dispatch = useDispatch();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const calculateSettings = useSelector(
    (state: any) => state.calculateSettings,
  );
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [submitErrorMessages, setSubmitErrorMessages] = useState<string>(
    StringConstants.EMPTY_STRING,
  );
  const {currentTheme} = useTheme();
  const maleLabel = Translate(GeneralLanguageConstants.Male);
  const femaleLabel = Translate(GeneralLanguageConstants.Female);
  const calculateLabel = Translate(GeneralLanguageConstants.Calculate);
  const birthDateError = Translate(
    MissedTrackingLanguageConstants.BirthDateError,
  );
  const birthDatePubertyError = Translate(
    MissedTrackingLanguageConstants.BirthDatePubertyError,
  );
  const birthDateControlError = Translate(
    MissedTrackingLanguageConstants.BirthDateControlError,
  );
  const fastsNotCalculatedError = Translate(
    FastingFormLanguageConstants.FastsNotCalculatedError,
  );
  const noOutstandingFasts = Translate(
    FastingFormLanguageConstants.NoOutstandingFasts,
  );
  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );
  const {i18n} = useTranslation();
  const showHideDatepicker = () => {
    setShow(!show);
  };
  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, []);

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      gender: StringConstants.EMPTY_STRING,
      date: new Date(),
      entryIntoPubertyAge: undefined,
      fastingPerformedCount: undefined,
    },
  });
  const onSubmit = data => {
    let errorMessage: string = StringConstants.EMPTY_STRING;

    setSubmitErrorMessages(StringConstants.EMPTY_STRING);
    setShow(false);
    const fastingCalculatorDate = new Date(data.date);
    if (data.date instanceof Date) {
      fastingCalculatorDate.setFullYear(
        fastingCalculatorDate.getFullYear() + Number(data.entryIntoPubertyAge),
      );
      if (new Date(data.date) > new Date()) {
        errorMessage = birthDateError;
      } else if (new Date() < fastingCalculatorDate) {
        errorMessage = birthDatePubertyError;
      }
    } else {
      errorMessage = birthDateControlError;
    }

    if (!isNullOrEmptyString(errorMessage)) {
      return setSubmitErrorMessages(errorMessage);
    }
    let missedFastingCount =
      calculateRamadanCountBetweenDates(fastingCalculatorDate, new Date()) * 30;
    if (data.gender === Gender.Female) {
      const ramadanCount = calculateRamadanCountBetweenDates(
        data.date,
        fastingCalculatorDate,
      );
      missedFastingCount +=
        Math.abs(ramadanCount) * calculateSettings.numberOfMenstrualCycle;
    }
    if (
      !isNullOrEmptyString(data.fastingPerformedCount) &&
      isNumber(data.fastingPerformedCount)
    ) {
      missedFastingCount -= data.fastingPerformedCount;
    }
    if (missedFastingCount < 0) {
      setSubmitErrorMessages(fastsNotCalculatedError);
    } else if (missedFastingCount === 0) {
      setSubmitErrorMessages(noOutstandingFasts);
    } else {
      dispatch(createMissedFasting(missedFastingCount));
    }
  };

  return (
    <>
      <TableView
        cardViewShadow
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
                  {date?.toLocaleDateString(dateLocale)}
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
                      locale={dateLocale}
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
                  value={(value ?? StringConstants.EMPTY_STRING).toString()}
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
            name="fastingPerformedCount"
            label={Translate(
              CalculatedMissedFastingLanguageConstants.NumberofFastsKept,
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
                  value={(value ?? StringConstants.EMPTY_STRING).toString()}
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
      <ErrorView
        message={submitErrorMessages}
        duration={3}
        style={styles.errorMessageStyle}
      />
    </>
  );
};

export default FastingForm;
