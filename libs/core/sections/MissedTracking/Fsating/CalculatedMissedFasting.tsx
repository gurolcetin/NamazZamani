import React, { useMemo } from 'react';
import {
  CardView,
  CardViewProps,
  InputSpinner,
  ProgressBar,
  SubmitButton,
} from '../../../../components';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Text, View } from 'react-native';
import { createStyles } from './style';
import { useTheme } from '../../../providers';
import { getFontScaleMultiplier, hapticFeedback } from '../../../helpers';
import {
  CalculatedMissedFastingLanguageConstants,
  CalculatedMissedPrayerLanguageConstants,
  GeneralLanguageConstants,
  HapticFeedbackMethods,
  StringConstants,
} from '../../../../common/constants';
import { FontScaleOption } from '../../../../common/enums';
import { useTranslation } from 'react-i18next';
import {
  decreasePerformedFasting,
  increasePerformedFasting,
  resetMissedFasting,
} from '../../../../redux/reducers/MissedFasting';

const CalculatedMissedFasting = () => {
  const dispatch = useDispatch();
  const missedFasting = useSelector((state: any) => state.missedFasting);
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const applicationSettings = useSelector(
    (state: any) => state.applicationSettings,
  );
  const fontScalePreference =
    applicationSettings?.fontScale ?? FontScaleOption.MEDIUM;
  const fontScaleMultiplier = useMemo(
    () => getFontScaleMultiplier(fontScalePreference),
    [fontScalePreference],
  );
  const styles = useMemo(
    () => createStyles(fontScaleMultiplier),
    [fontScaleMultiplier],
  );
  const recalculateMessage = t(
    CalculatedMissedPrayerLanguageConstants.RecalculateMessage.key,
  );
  const no = t(GeneralLanguageConstants.No.key);
  const yes = t(GeneralLanguageConstants.Yes.key);
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
      t(CalculatedMissedFastingLanguageConstants.NumberofFastsKept.key) +
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
              {t(CalculatedMissedFastingLanguageConstants.Fasting.key)}
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
        label={t(CalculatedMissedPrayerLanguageConstants.Recalculate.key)}
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
            {
              color: currentTheme.textColor,
              fontSize: 14 * fontScaleMultiplier,
            },
          ]}
        >
          {t(GeneralLanguageConstants.LastUpdateDate.key)}
          {StringConstants.COLON}
          {StringConstants.SPACE}
          {new Date(missedFasting.lastUpdateDate).toLocaleString(i18n.language)}
        </Text>
        <Text
          style={[
            styles.bottomDescriptionText,
            {
              color: currentTheme.textColor,
              fontSize: 14 * fontScaleMultiplier,
            },
          ]}
        >
          {t(GeneralLanguageConstants.BeginDate.key)}
          {StringConstants.COLON}
          {StringConstants.SPACE}
          {new Date(missedFasting.beginDate).toLocaleString(i18n.language)}
        </Text>
      </View>
    </>
  );
};

export default CalculatedMissedFasting;
