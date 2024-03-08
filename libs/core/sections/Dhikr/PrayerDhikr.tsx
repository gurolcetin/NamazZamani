import React, {useEffect} from 'react';
import {View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  DhikrTabKeys,
  GeneralLanguageConstants,
  HapticFeedbackMethods,
} from '../../../common/constants';
import {CardView, CircleProgressBar, SubmitButton} from '../../../components';
import styles from './style';
import {
  resetDhikr,
  resetPrayerDhikr,
  updateDhikr,
} from '../../../redux/reducers/Dhikr';
import {Translate, hapticFeedback} from '../../helpers';

const PrayerDhikr = () => {
  const dispatch = useDispatch();

  const allDhikrList = useSelector(
    (state: any) =>
      state.dhikr.dhikrs.find((x: {id: number}) => x.id === DhikrTabKeys.Prayer)
        .dhikrList,
  );
  useEffect(() => {
  }, []);
  return (
    <View>
      <CardView cardStyle={styles.container} paddingLeft={0} shadow>
        {allDhikrList.map(
          (item: {
            dhikrId: number;
            name: string;
            count: number;
            maxCount: number;
          }) => {
            return (
              <CircleProgressBar
                key={item.dhikrId}
                progress={(item.count / item.maxCount) * 100}
                size={75}
                count={item.count}
                maxCount={item.maxCount}
                description={item.name}
                incraseValue={() => {
                  dispatch(
                    updateDhikr({
                      id: DhikrTabKeys.Prayer,
                      dhikrId: item.dhikrId,
                    }),
                  );
                }}
              />
            );
          },
        )}
      </CardView>
      <SubmitButton
        label={Translate(GeneralLanguageConstants.Reset)}
        onSubmit={() => {
          dispatch(resetPrayerDhikr());
          hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
        }}
        buttonStyle={{marginHorizontal: 25, marginTop: 20}}
      />
    </View>
  );
};

export default PrayerDhikr;
