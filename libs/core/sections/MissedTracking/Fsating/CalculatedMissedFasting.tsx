import React from 'react';
import {
  CardView,
  CardViewProps,
  InputSpinner,
  ProgressBar,
  SubmitButton,
} from '../../../../components';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Text, View } from 'react-native';
import styles from './style';
import { useTheme } from '../../../providers';
import { hapticFeedback } from '../../../helpers';
import {
  CalculatedMissedFastingLanguageConstants,
  CalculatedMissedPrayerLanguageConstants,
  GeneralLanguageConstants,
  HapticFeedbackMethods,
  StringConstants,
} from '../../../../common/constants';
import { useTranslation } from 'react-i18next';
import {
  decreasePerformedFasting,
  increasePerformedFasting,
  resetMissedFasting,
} from '../../../../redux/reducers/MissedFasting';
import type { LanguageModel } from '../../../../common/models';

const CalculatedMissedFasting = () => {
  const dispatch = useDispatch();
  const missedFasting = useSelector((state: any) => state.missedFasting);
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const translate = (languageModel: LanguageModel) => t(languageModel.key);

  const recalculateMessage = translate(
    CalculatedMissedPrayerLanguageConstants.RecalculateMessage,
  );
  const no = translate(GeneralLanguageConstants.No);
  const yes = translate(GeneralLanguageConstants.Yes);
  const reCalculateButtonAlert = () =>
    Alert.alert(
      recalculateMessage,
      '',
      [
        {
          text: no,
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: yes,
          onPress: () => dispatch(resetMissedFasting()),
        },
      ],
      { userInterfaceStyle: applicationTheme.theme },
    );

  const cardViewProps: CardViewProps = {
    paddingLeft: 0,
    bottomDescription:
      translate(
        CalculatedMissedFastingLanguageConstants.NumberofFastsKept,
      ) +
      StringConstants.COLON +
      StringConstants.SPACE +
      missedFasting.missedFasting.performedFastingCount,
    bottomDescriptionStyle: [
      styles.bottomDescription,
      { color: currentTheme.textColor },
    ],
    cardStyle: { overflow: 'hidden' },
    children: (
      <>
        <View style={styles.container}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>
              {translate(CalculatedMissedFastingLanguageConstants.Fasting)}
            </Text>
            <View style={styles.calculatedMissedPrayerRightContainer}>
              <InputSpinner
                value={
                  missedFasting.missedFasting.missedFastingCount -
                  missedFasting.missedFasting.performedFastingCount
                }
                inceaseValue={() => {
                  dispatch(
                    increasePerformedFasting(missedFasting.missedFasting),
                  );
                }}
                decreaseValue={() => {
                  dispatch(
                    decreasePerformedFasting(missedFasting.missedFasting),
                  );
                }}
              />
            </View>
          </View>
        </View>
        <View style={styles.calculatedMissedPrayerProgress}>
          <ProgressBar
            progress={
              (missedFasting.missedFasting.performedFastingCount /
                missedFasting.missedFasting.missedFastingCount) *
              100
            }
          />
        </View>
      </>
    ),
  };

  return (
    <>
      <CardView {...cardViewProps} paddingLeft={0} />
      <SubmitButton
        label={translate(CalculatedMissedPrayerLanguageConstants.Recalculate)}
        onSubmit={() => {
          reCalculateButtonAlert();
          hapticFeedback(HapticFeedbackMethods.ImpactMedium);
        }}
        backgroundColor={currentTheme.systemRed}
        marginHorizontal={25}
        marginTop={20}
      />
      <View style={styles.calculatedMissedPrayerBottomDescription}>
        <Text
          style={[
            styles.bottomDescriptionText,
            { color: currentTheme.textColor },
          ]}
        >
          {translate(GeneralLanguageConstants.LastUpdateDate)}
          {StringConstants.COLON}
          {StringConstants.SPACE}
          {new Date(missedFasting.lastUpdateDate).toLocaleString(i18n.language)}
        </Text>
        <Text
          style={[
            styles.bottomDescriptionText,
            { color: currentTheme.textColor },
          ]}
        >
          {translate(GeneralLanguageConstants.BeginDate)}
          {StringConstants.COLON}
          {StringConstants.SPACE}
          {new Date(missedFasting.beginDate).toLocaleString(i18n.language)}
        </Text>
      </View>
    </>
  );
};

export default CalculatedMissedFasting;
