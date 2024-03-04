import React from 'react';
import {
  CardView,
  CardViewProps,
  InputSpinner,
  ProgressBar,
  SubmitButton,
} from '../../../../components';
import {useDispatch, useSelector} from 'react-redux';
import {Alert, Text, View} from 'react-native';
import styles from './style';
import {useTheme} from '../../../providers';
import {GetPrayerNameByLanguage, Translate} from '../../../helpers';
import {
  CalculatedMissedFastingLanguageConstants,
  CalculatedMissedPrayerLanguageConstants,
  GeneralLanguageConstants,
  StringConstants,
} from '../../../../common/constants';
import {useTranslation} from 'react-i18next';
import {
  decreasePerformedFasting,
  increasePerformedFasting,
  resetMissedFasting,
} from '../../../../redux/reducers/MissedFasting';

const CalculatedMissedFasting = () => {
  const dispatch = useDispatch();
  const missedFasting = useSelector((state: any) => state.missedFasting);
  const {currentTheme} = useTheme();
  const {i18n} = useTranslation();
  const recalculateMessage = Translate(
    CalculatedMissedPrayerLanguageConstants.RecalculateMessage,
  );
  const no = Translate(GeneralLanguageConstants.No);
  const yes = Translate(GeneralLanguageConstants.Yes);
  const reCalculateButtonAlert = () =>
    Alert.alert(recalculateMessage, '', [
      {
        text: no,
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: yes,
        onPress: () => dispatch(resetMissedFasting()),
      },
    ]);

  const cardViewProps: CardViewProps = {
    paddingLeft: 0,
    bottomDescription:
      Translate(CalculatedMissedFastingLanguageConstants.NumberofFastsKept) + 
      StringConstants.COLON +
      StringConstants.SPACE +
      missedFasting.missedFasting.performedFastingCount,
    bottomDescriptionStyle: [
      styles.bottomDescription,
      {color: currentTheme.textColor},
    ],
    cardStyle: {overflow: 'hidden'},
    children: (
      <>
        <View style={styles.container}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, {color: currentTheme.textColor}]}>
              {Translate(CalculatedMissedFastingLanguageConstants.Fasting)}
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
        label={Translate(CalculatedMissedPrayerLanguageConstants.Recalculate)}
        onSubmit={() => {
          reCalculateButtonAlert();
        }}
        backgroundColor={currentTheme.systemRed}
        marginHorizontal={25}
        marginTop={20}
      />
      <View style={styles.calculatedMissedPrayerBottomDescription}>
        <Text style={{color: currentTheme.textColor}}>
          {Translate(GeneralLanguageConstants.LastUpdateDate)}
          {StringConstants.COLON}
          {StringConstants.SPACE}
          {new Date(missedFasting.lastUpdateDate).toLocaleString(
            i18n.language,
          )}
        </Text>
        <Text style={{color: currentTheme.textColor}}>
          {Translate(GeneralLanguageConstants.BeginDate)}
          {StringConstants.COLON}
          {StringConstants.SPACE}
          {new Date(missedFasting.beginDate).toLocaleString(i18n.language)}
        </Text>
      </View>
    </>
  );
};

export default CalculatedMissedFasting;
