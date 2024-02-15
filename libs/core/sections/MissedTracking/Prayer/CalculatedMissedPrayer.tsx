import React, {useEffect} from 'react';
import {
  CardView,
  CardViewProps,
  InputSpinner,
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

const CalculatedMissedPrayer = () => {
  const dispatch = useDispatch();
  const missedPrayer = useSelector((state: any) => state.missedPrayer);
  const {currentTheme} = useTheme();
  const reCalculateButtonAlert = () =>
    Alert.alert('Yeniden Hesaplamak İstiyor Musunuz?', '', [
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
          children: (
            <>
              <View style={styles.container}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, {color: currentTheme.textColor}]}>
                    {prayer.name}
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
            </>
          ),
        };
        return <CardView key={index} {...cardViewProps} paddingLeft={0} />;
      })}
      <SubmitButton
        label="Yeniden Hesapla"
        onSubmit={() => {
          reCalculateButtonAlert();
        }}
        backgroundColor="red"
        marginHorizontal={25}
        marginTop={20}
      />
    </>
  );
};

export default CalculatedMissedPrayer;
