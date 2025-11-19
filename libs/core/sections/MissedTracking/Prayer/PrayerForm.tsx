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
import {
  isNullOrEmptyString,
  isNullOrUndefined,
  isNumber,
} from 'typescript-util-functions';
import { useTheme } from '../../../providers';
import {
  Gender,
  GeneralLanguageConstants,
  LanguageLocaleKeys,
  LanguagePrefix,
  MissedPrayerFormLanguageConstants,
  MissedTrackingLanguageConstants,
  StringConstants,
} from '../../../../common/constants';
import { Translate } from '../../../helpers';
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
};

const PrayerForm: React.FC = () => {
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
  const daysOfPrayerLabel = Translate(
    MissedPrayerFormLanguageConstants.NumberofDaysofPrayer,
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
  const numberofMissedPrayerBirthDatePubertyError = Translate(
    MissedPrayerFormLanguageConstants.NumberofMissedPrayerBirthDatePubertyError,
  );
  const missedPrayerNotCalculatedError = Translate(
    MissedPrayerFormLanguageConstants.MissedPrayerNotCalculatedError,
  );
  const noMissedPrayer = Translate(
    MissedPrayerFormLanguageConstants.NoMissedPrayer,
  );
  const requiredMessage = Translate(GeneralLanguageConstants.RequiredMessage);
  const pubertyValidateMessage = Translate(
    MissedPrayerFormLanguageConstants.EntryIntoPubertyAgeValidateMessage,
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
    formState: { errors },
  } = useForm<PrayerFormValues>({
    defaultValues: {
      gender: '' as Gender | '',
      date: new Date(),
      entryIntoPubertyAge: undefined,
      prayersPerformedCount: undefined,
    },
  });

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
      let menstrualCycle = !isNullOrUndefined(calculateSettings?.menstrualCycle)
        ? calculateSettings.menstrualCycle
        : 7;
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
      <View
        style={[
          styles.root,
          { backgroundColor: '#f3f7ff' }, // gradient yerine tek renk
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main card */}
          <View style={styles.card}>
            {/* Gender */}
            <FieldGroup
              label={genderLabel}
              error={errors.gender?.message as string}
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
                      placeholderTextColor="#cbd5e1"
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
};

const FieldGroup: React.FC<FieldGroupProps> = ({ label, error, children }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {!!error && <Text style={styles.fieldError}>{error}</Text>}
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 20,
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
    color: '#374151',
    marginBottom: 10,
  },
  fieldError: {
    marginTop: 4,
    fontSize: 12,
    color: '#dc2626',
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
