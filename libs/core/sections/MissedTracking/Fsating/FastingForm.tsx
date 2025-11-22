import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ErrorView, FormSegmentedControl } from '../../../../components';
import { isNullOrEmptyString, isNumber } from 'typescript-util-functions';
import { useTheme } from '../../../providers';
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
import { Translate, calculateRamadanCountBetweenDates } from '../../../helpers';
import { createMissedFasting } from '../../../../redux/reducers/MissedFasting';

type FastingFormValues = {
  gender: Gender | '';
  date: Date;
  entryIntoPubertyAge?: any;
  fastingPerformedCount?: any;
};

const FastingForm: React.FC = () => {
  const dispatch = useDispatch();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const calculateSettings = useSelector(
    (state: any) => state.calculateSettings,
  );
  const { currentTheme } = useTheme();
  const { i18n } = useTranslation();

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitErrorMessages, setSubmitErrorMessages] = useState<string>(
    StringConstants.EMPTY_STRING,
  );
  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );

  // --- Translations / labels -------------------------------------------------
  const maleLabel = Translate(GeneralLanguageConstants.Male);
  const femaleLabel = Translate(GeneralLanguageConstants.Female);
  const calculateLabel = Translate(GeneralLanguageConstants.Calculate);

  const genderLabel = Translate(MissedPrayerFormLanguageConstants.Gender);
  const birthDateLabel = Translate(MissedPrayerFormLanguageConstants.BirthDate);
  const pubertyAgeLabel = Translate(
    MissedPrayerFormLanguageConstants.EntryIntoPubertyAge,
  );
  const fastingPerformedLabel = Translate(
    CalculatedMissedFastingLanguageConstants.NumberofFastsKept,
  );

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
  const requiredMessage = Translate(GeneralLanguageConstants.RequiredMessage);
  const pubertyValidateMessage = Translate(
    MissedPrayerFormLanguageConstants.EntryIntoPubertyAgeValidateMessage,
  );

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FastingFormValues>({
    defaultValues: {
      gender: '' as Gender | '',
      date: new Date(),
      entryIntoPubertyAge: undefined,
      fastingPerformedCount: undefined,
    },
  });

  const toggleDatePicker = () => setShowDatePicker(prev => !prev);

  // --- BUSINESS: eski onSubmit bire bir korunuyor ----------------------------
  const onSubmit = (data: FastingFormValues) => {
    let errorMessage: string = StringConstants.EMPTY_STRING;

    setSubmitErrorMessages(StringConstants.EMPTY_STRING);
    setShowDatePicker(false);

    const fastingCalculatorDate = new Date(data.date as any);
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
      missedFastingCount -= Number(data.fastingPerformedCount);
    }

    if (missedFastingCount < 0) {
      setSubmitErrorMessages(fastsNotCalculatedError);
    } else if (missedFastingCount === 0) {
      setSubmitErrorMessages(noOutstandingFasts);
    } else {
      dispatch(createMissedFasting(missedFastingCount));
    }
  };

  const primary = currentTheme.primary;

  return (
    <>
      <View style={[styles.root]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main card */}
          <View
            style={[
              styles.card,
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
          >
            {/* Gender */}
            <FieldGroup
              label={genderLabel}
              error={errors.gender?.message as string}
              textColor={currentTheme.textColor}
              errorColor={currentTheme.formErrorColor}
            >
              <Controller
                control={control}
                name="gender"
                rules={{ required: requiredMessage }}
                render={({ field: { value, onChange } }) => (
                  <FormSegmentedControl
                    options={[
                      { label: maleLabel, value: Gender.Male },
                      { label: femaleLabel, value: Gender.Female },
                    ]}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </FieldGroup>

            {/* Birth Date */}
            <FieldGroup
              label={birthDateLabel}
              error={errors.date?.message as string}
              textColor={currentTheme.textColor}
              errorColor={currentTheme.formErrorColor}
            >
              <Controller
                control={control}
                name="date"
                rules={{ required: requiredMessage }}
                render={({ field: { value, onChange } }) => (
                  <>
                    <Pressable
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: currentTheme.inputBackgroundColor,
                        },
                      ]}
                      onPress={toggleDatePicker}
                    >
                      <Text
                        style={[
                          styles.inputText,
                          { color: currentTheme.textColor },
                        ]}
                      >
                        {(date ?? value ?? new Date()).toLocaleDateString(
                          dateLocale,
                        )}
                      </Text>
                    </Pressable>

                    {showDatePicker && (
                      <DateTimePicker
                        themeVariant={applicationTheme.theme}
                        testID="dateTimePicker"
                        value={value ?? new Date()}
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
                )}
              />
            </FieldGroup>

            {/* Puberty Age */}
            <FieldGroup
              label={pubertyAgeLabel}
              error={errors.entryIntoPubertyAge?.message as string}
              textColor={currentTheme.textColor}
              errorColor={currentTheme.formErrorColor}
            >
              <Controller
                control={control}
                name="entryIntoPubertyAge"
                rules={{
                  required: requiredMessage,
                  validate: value => {
                    if (!isNullOrEmptyString(value)) {
                      const numeric = Number(value);
                      if (numeric && numeric < 8) {
                        return pubertyValidateMessage;
                      }
                    }
                    return true;
                  },
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: currentTheme.inputBackgroundColor },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: currentTheme.textColor }]}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      placeholder="12"
                      placeholderTextColor={currentTheme.gray}
                      value={(value ?? StringConstants.EMPTY_STRING).toString()}
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
                    />
                  </View>
                )}
              />
            </FieldGroup>

            {/* Number of fasts already kept */}
            <FieldGroup
              label={fastingPerformedLabel}
              error={errors.fastingPerformedCount?.message as string}
              textColor={currentTheme.textColor}
              errorColor={currentTheme.formErrorColor}
            >
              <Controller
                control={control}
                name="fastingPerformedCount"
                rules={{ required: false }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: currentTheme.inputBackgroundColor },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: currentTheme.textColor }]}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={currentTheme.gray}
                      value={(value ?? StringConstants.EMPTY_STRING).toString()}
                      onChangeText={val => {
                        if (isNullOrEmptyString(val) || isNumber(val)) {
                          if (Number(val) > 99999) {
                            return onChange(99999);
                          } else {
                            onChange(val);
                          }
                        }
                      }}
                    />
                  </View>
                )}
              />
            </FieldGroup>
          </View>

          {/* Calculate button */}
          <Pressable
            style={[styles.calculateButton, { backgroundColor: primary }]}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.calculateText}>{calculateLabel}</Text>
          </Pressable>
        </ScrollView>
      </View>

      <ErrorView
        message={submitErrorMessages}
        duration={3}
        style={styles.errorMessage}
      />
    </>
  );
};

export default FastingForm;

/* ----------------------------- Alt komponentler ----------------------------- */

type FieldGroupProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
  textColor: string;
  errorColor: string;
};

const FieldGroup: React.FC<FieldGroupProps> = ({
  label,
  error,
  children,
  textColor,
  errorColor,
}) => (
  <View style={styles.fieldGroup}>
    <Text
      style={[
        styles.fieldLabel,
        {
          color: textColor,
        },
      ]}
    >
      {label}
    </Text>
    {children}
    {!!error && (
      <Text style={[styles.fieldError, { color: errorColor }]}>{error}</Text>
    )}
  </View>
);

/* ---------------------------------- Styles --------------------------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  fieldGroup: {
    marginTop: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  fieldError: {
    marginTop: 4,
    fontSize: 12,
  },
  inputWrapper: {
    height: 52,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  inputText: {
    flex: 1,
    fontSize: 14,
  },
  calculateButton: {
    marginTop: 24,
    borderRadius: 24,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    marginHorizontal: 20,
    marginTop: 8,
  },
});
