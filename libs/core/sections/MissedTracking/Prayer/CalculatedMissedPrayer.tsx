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
import {
  decreasePerformedPrayer,
  increasePerformedPrayer,
  resetMissedPrayer,
} from '../../../../redux/reducers/MissedPrayer';
import styles from './style';
import { useTheme } from '../../../providers';
import { GetPrayerNameByLanguage, hapticFeedback } from '../../../helpers';
import {
  CalculatedMissedPrayerLanguageConstants,
  GeneralLanguageConstants,
  HapticFeedbackMethods,
  StringConstants,
} from '../../../../common/constants';
import { useTranslation } from 'react-i18next';

const CalculatedMissedPrayer = () => {
  const dispatch = useDispatch();
  const missedPrayer = useSelector((state: any) => state.missedPrayer);
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const applicationTheme = useSelector((state: any) => state.applicationTheme);
  const recalculateMessage = t(
    CalculatedMissedPrayerLanguageConstants.RecalculateMessage.key,
  );
  const no = t(GeneralLanguageConstants.No.key);
  const yes = t(GeneralLanguageConstants.Yes.key);
  const reCalculateButtonAlert = () => {
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
          onPress: () => dispatch(resetMissedPrayer()),
        },
      ],
      { userInterfaceStyle: applicationTheme.theme },
    );
  };

  return (
    <>
      {missedPrayer.missedPrayers.map((prayer: any, index: any) => {
        const translatedPrayerName = GetPrayerNameByLanguage(prayer.name, t);
        let cardViewProps: CardViewProps = {
          paddingLeft: 0,
          bottomDescription: t('MissedPrayerForm.PerformedPrayerCountLabel', {
            name: translatedPrayerName,
            count: prayer.performedPrayerCount,
          }),
          bottomDescriptionStyle: [
            styles.bottomDescription,
            { color: currentTheme.textColor },
          ],
          cardStyle: { overflow: 'hidden' },
          children: (
            <>
              <View style={styles.container}>
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.label, { color: currentTheme.textColor }]}
                  >
                    {translatedPrayerName}
                  </Text>
                  <View style={styles.calculatedMissedPrayerRightContainer}>
                    <InputSpinner
                      value={
                        prayer.missedPrayerCount - prayer.performedPrayerCount
                      }
                      inceaseValue={() => {
                        dispatch(increasePerformedPrayer(prayer));
                      }}
                      decreaseValue={() => {
                        dispatch(decreasePerformedPrayer(prayer));
                      }}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.calculatedMissedPrayerProgress}>
                <ProgressBar
                  progress={
                    (prayer.performedPrayerCount / prayer.missedPrayerCount) *
                    100
                  }
                />
              </View>
            </>
          ),
        };
        return <CardView key={index} {...cardViewProps} paddingLeft={0} />;
      })}
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
            { color: currentTheme.textColor },
          ]}
        >
          {t(GeneralLanguageConstants.LastUpdateDate.key)}
          {StringConstants.COLON}
          {StringConstants.SPACE}
          {new Date(missedPrayer.lastUpdateDate).toLocaleString(i18n.language)}
        </Text>
        <Text
          style={[
            styles.bottomDescriptionText,
            { color: currentTheme.textColor },
          ]}
        >
          {t(GeneralLanguageConstants.BeginDate.key)}
          {StringConstants.COLON}
          {StringConstants.SPACE}
          {new Date(missedPrayer.beginDate).toLocaleString(i18n.language)}
        </Text>
      </View>
    </>
  );
};

export default CalculatedMissedPrayer;
