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
import {
  decreasePerformedPrayer,
  increasePerformedPrayer,
  resetMissedPrayer,
} from '../../../../redux/reducers/MissedPrayer';
import styles from './style';
import {useTheme} from '../../../providers';
import {GetPrayerNameByLanguage, Translate} from '../../../helpers';
import {
  CalculatedMissedPrayerLanguageConstants,
  GeneralLanguageConstants,
  StringConstants,
} from '../../../../common/constants';
import {useTranslation} from 'react-i18next';

const CalculatedMissedPrayer = () => {
  const dispatch = useDispatch();
  const missedPrayer = useSelector((state: any) => state.missedPrayer);
  const {currentTheme} = useTheme();
  const {i18n} = useTranslation();
  const recalculateMessage = Translate(
    CalculatedMissedPrayerLanguageConstants.RecalculateMessage,
  );
  const no = Translate(GeneralLanguageConstants.No);
  const yes = Translate(GeneralLanguageConstants.Yes);
  const reCalculateButtonAlert = () => {
    console.log(missedPrayer);
    Alert.alert(recalculateMessage, '', [
      {
        text: no,
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: yes,
        onPress: () => dispatch(resetMissedPrayer()),
      },
    ]);
  };

  return (
    <>
      {missedPrayer.missedPrayers.map((prayer: any, index: any) => {
        let cardViewProps: CardViewProps = {
          paddingLeft: 0,
          bottomDescription:
            'Kılınan Toplam ' +
            GetPrayerNameByLanguage(prayer.name) +
            ' Namazı Sayısı: ' +
            prayer.performedPrayerCount,
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
                    {GetPrayerNameByLanguage(prayer.name)}
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
          {new Date(missedPrayer.lastUpdateDate).toLocaleString(
            i18n.language,
          )}
        </Text>
        <Text style={{color: currentTheme.textColor}}>
          {Translate(GeneralLanguageConstants.BeginDate)}
          {StringConstants.COLON}
          {StringConstants.SPACE}
          {new Date(missedPrayer.beginDate).toLocaleString(i18n.language)}
        </Text>
      </View>
    </>
  );
};

export default CalculatedMissedPrayer;
