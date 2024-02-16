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
  StringConstants,
} from '../../../../common/constants';

const CalculatedMissedPrayer = () => {
  const dispatch = useDispatch();
  const missedPrayer = useSelector((state: any) => state.missedPrayer);
  const {currentTheme} = useTheme();
  const recalculateMessage = Translate(
    CalculatedMissedPrayerLanguageConstants.RecalculateMessage,
  );
  const reCalculateButtonAlert = () =>
    Alert.alert(recalculateMessage, '', [
      {
        text: 'Hayır',
        onPress: () => {},
        style: 'cancel',
      },
      {text: 'Evet', onPress: () => dispatch(resetMissedPrayer())},
    ]);

  return (
    <>
      {missedPrayer.missedPrayers.map((prayer, index) => {
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
        backgroundColor="red"
        marginHorizontal={25}
        marginTop={20}
      />
      <View
        style={{alignItems: 'center', justifyContent: 'center', marginTop: 10}}>
        <Text>
          Son Güncelleme Tarihi:
          {StringConstants.SPACE}
          {new Date(missedPrayer.lastUpdateDate).toLocaleDateString('tr-TR')}
        </Text>
        <Text>
          Kaza Namazına Başlangıç Tarihi:
          {StringConstants.SPACE}
          {new Date(missedPrayer.beginDate).toLocaleDateString('tr-TR')}
        </Text>
      </View>
    </>
  );
};

export default CalculatedMissedPrayer;
