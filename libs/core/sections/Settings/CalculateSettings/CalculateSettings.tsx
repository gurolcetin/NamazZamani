import React, {useState} from 'react';
import {
  ErrorView,
  ScreenViewContainer,
  SubmitButton,
  TableView,
} from '../../../../components';
import {ScrollView, TextInput} from 'react-native';
import {useForm} from 'react-hook-form';
import {FormControl} from '../../../../components/FormControl/FormControl';
import styles from './style';
import {isNullOrEmptyString, isNumber} from 'typescript-util-functions';
import {useTheme} from '../../../providers';
import {
  CalculateSettingsLanguageConstants,
  GeneralLanguageConstants,
  MissedPrayerFormLanguageConstants,
  StringConstants,
} from '../../../../common/constants';
import {Translate} from '../../../helpers';
import {useDispatch, useSelector} from 'react-redux';
import {updateMenstrualCycle} from '../../../../redux/reducers/CalculateSettings';

const CalculateSettings = ({navigation}) => {
  const dispatch = useDispatch();
  const calculateSettings = useSelector(
    (state: any) => state.calculateSettings,
  );
  const {currentTheme} = useTheme();

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      numberOfMenstrualCycle: undefined,
    },
  });

  const onSubmit = data => {
    if (isNullOrEmptyString(data.numberOfMenstrualCycle)) {
      dispatch(updateMenstrualCycle({numberOfMenstrualCycle: undefined}));
    } else if (
      isNumber(data.numberOfMenstrualCycle) &&
      Number(data.numberOfMenstrualCycle) >= 0
    ) {
      dispatch(
        updateMenstrualCycle({
          numberOfMenstrualCycle: Number(data.numberOfMenstrualCycle),
        }),
      );
    }
    navigation.goBack();
  };

  return (
    <ScreenViewContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TableView
          paddingVertical={15}
          dividerSliceCount={2}
          childrenList={[
            <FormControl
              rules={{
                required: false,
                validate: value => {
                  if (value && value < 0) {
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
              name="numberOfMenstrualCycle"
              label={Translate(
                CalculateSettingsLanguageConstants.NumberOfMenstrualDays,
              )}
              labelFontSize={15}
              defaultValue={calculateSettings.numberOfMenstrualCycle}
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
                        if (Number(val) > 10) {
                          return onChange(10);
                        } else if (Number(val) < 0) {
                          return onChange(undefined);
                        } else {
                          onChange(val);
                        }
                      }
                    }}
                    value={(value ?? StringConstants.EMPTY_STRING).toString()}
                    keyboardType="numeric"
                    placeholder="6"
                    placeholderTextColor={currentTheme.gray}
                    autoComplete="off"
                  />
                </>
              )}
            />,
          ]}
        />
        <SubmitButton
          onSubmit={handleSubmit(onSubmit)}
          label="Kaydet"
          marginHorizontal={25}
          marginTop={20}
        />
      </ScrollView>
    </ScreenViewContainer>
  );
};

export default CalculateSettings;
