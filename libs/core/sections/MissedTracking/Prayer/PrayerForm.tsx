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
  CalculateSettingsLanguageConstants,
  Gender,
  GeneralLanguageConstants,
  LanguageLocaleKeys,
  LanguagePrefix,
  MissedPrayerFormLanguageConstants,
  MissedTrackingLanguageConstants,
  StringConstants,
} from '../../../../common/constants';
import {
  calculateDaysBetweenDates,
  calculateMonthsBetweenDates,
} from '../../../utils';
import { createMissedPrayer } from '../../../../redux/reducers/MissedPrayer';

type PrayerFormValues = {
  gender: Gender | '';
  date: Date;
  entryIntoPubertyAge?: any;
  prayersPerformedCount?: any;
  menstrualCycle?: any;
};

const PrayerForm: React.FC = () => {
  const dispatch = useDispatch();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitErrorMessages, setSubmitErrorMessages] = useState<string>(
    StringConstants.EMPTY_STRING,
  );
  const [dateLocale, setDateLocale] = useState<string>(
    LanguageLocaleKeys.TURKISH,
  );

  // --- Translations / labels -------------------------------------------------
  const maleLabel = t(GeneralLanguageConstants.Male.key);
  const femaleLabel = t(GeneralLanguageConstants.Female.key);
  const calculateLabel = t(GeneralLanguageConstants.Calculate.key);

  const genderLabel = t(MissedPrayerFormLanguageConstants.Gender.key);
  const birthDateLabel = t(MissedPrayerFormLanguageConstants.BirthDate.key);
  const pubertyAgeLabel = t(
    MissedPrayerFormLanguageConstants.EntryIntoPubertyAge.key,
  );
  const daysOfPrayerLabel = t(
    MissedPrayerFormLanguageConstants.NumberofDaysofPrayer.key,
  );
  const menstrualCycleLabel = t(
    CalculateSettingsLanguageConstants.NumberOfMenstrualDays.key,
  );

  const birthDateError = t(MissedTrackingLanguageConstants.BirthDateError.key);
  const birthDatePubertyError = t(
    MissedTrackingLanguageConstants.BirthDatePubertyError.key,
  );
  const birthDateControlError = t(
    MissedTrackingLanguageConstants.BirthDateControlError.key,
  );
  const numberofMissedPrayerBirthDatePubertyError = t(
    MissedPrayerFormLanguageConstants.NumberofMissedPrayerBirthDatePubertyError
      .key,
  );
  const missedPrayerNotCalculatedError = t(
    MissedPrayerFormLanguageConstants.MissedPrayerNotCalculatedError.key,
  );
  const noMissedPrayer = t(
    MissedPrayerFormLanguageConstants.NoMissedPrayer.key,
  );
  const requiredMessage = t(GeneralLanguageConstants.RequiredMessage.key);
  const pubertyValidateMessage = t(
    MissedPrayerFormLanguageConstants.EntryIntoPubertyAgeValidateMessage.key,
  );

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  useEffect(() => {
    setDateLocale(i18n.language ?? LanguagePrefix.TURKISH);
  }, [i18n.language]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PrayerFormValues>({
    defaultValues: {
      gender: '' as Gender | '',
      date: new Date(),
      entryIntoPubertyAge: undefined,
      prayersPerformedCount: undefined,
      menstrualCycle: undefined,
    },
  });

  const selectedGender = watch('gender');

  const toggleDatePicker = () => setShowDatePicker(prev => !prev);

  // --- BUSINESS: bire bir eski onSubmit --------------------------------------
  const onSubmit = (data: PrayerFormValues) => {
    let errorMessage: string = StringConstants.EMPTY_STRING;
    setSubmitErrorMessages(StringConstants.EMPTY_STRING);
    setShowDatePicker(false);

    const prayerCalculatorDate = new Date(data.date as any);
    if (data.date instanceof Date) {
      prayerCalculatorDate.setFullYear(
        prayerCalculatorDate.getFullYear() + Number(data.entryIntoPubertyAge),
      );
      if (new Date(data.date) > new Date()) {
        errorMessage = birthDateError;
      } else if (new Date() < prayerCalculatorDate) {
        errorMessage = birthDatePubertyError;
      } else if (
        !isNullOrEmptyString(data.prayersPerformedCount) &&
        isNumber(data.prayersPerformedCount)
      ) {
        prayerCalculatorDate.setDate(
          prayerCalculatorDate.getDate() + Number(data.prayersPerformedCount),
        );
        if (new Date() < prayerCalculatorDate) {
          errorMessage = numberofMissedPrayerBirthDatePubertyError;
        }
      }
    } else {
      errorMessage = birthDateControlError;
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
      const menstrualCycle = isNullOrEmptyString(data.menstrualCycle)
        ? 7
        : Math.min(Math.max(Number(data.menstrualCycle), 0), 10);
      missedPrayerCount -= Math.abs(totalMonths) * menstrualCycle;
    }
    if (missedPrayerCount < 0) {
      setSubmitErrorMessages(missedPrayerNotCalculatedError);
    } else if (missedPrayerCount === 0) {
      setSubmitErrorMessages(noMissedPrayer);
    } else {
      dispatch(createMissedPrayer(missedPrayerCount));
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

            {selectedGender === Gender.Female && (
              <FieldGroup
                label={menstrualCycleLabel}
                textColor={currentTheme.textColor}
                errorColor={currentTheme.formErrorColor}
              >
                <Controller
                  control={control}
                  name="menstrualCycle"
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
                        placeholder="7"
                        placeholderTextColor={currentTheme.gray}
                        value={
                          (value ?? StringConstants.EMPTY_STRING).toString()
                        }
                        onChangeText={val => {
                          if (isNullOrEmptyString(val)) {
                            return onChange(StringConstants.EMPTY_STRING);
                          }
                          if (!isNumber(val)) {
                            return;
                          }
                          const numeric = Math.min(
                            Math.max(Number(val), 0),
                            10,
                          );
                          onChange(numeric.toString());
                        }}
                      />
                    </View>
                  )}
                />
              </FieldGroup>
            )}

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
                        onChange={(_event, selectedDate) => {
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

            {/* Number of days of prayer */}
            <FieldGroup
              label={daysOfPrayerLabel}
              error={errors.prayersPerformedCount?.message as string}
              textColor={currentTheme.textColor}
              errorColor={currentTheme.formErrorColor}
            >
              <Controller
                control={control}
                name="prayersPerformedCount"
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

export default PrayerForm;

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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingBottom: 20,
    elevation: 2,
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
  inputIcon: {
    marginLeft: 8,
    fontSize: 16,
    color: '#9ca3af',
  },
  calculateButton: {
    marginTop: 24,
    borderRadius: 24,
    paddingVertical: 14,
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
