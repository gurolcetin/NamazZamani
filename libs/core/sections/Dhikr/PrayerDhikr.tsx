import React, {useEffect} from 'react';
import {View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {DhikrTabKeys} from '../../../common/constants';
import {CircleProgressBar, SubmitButton} from '../../../components';
import styles from './style';
import {resetDhikr, resetPrayerDhikr, updateDhikr} from '../../../redux/reducers/Dhikr';

const PrayerDhikr = () => {
  const dispatch = useDispatch();

  const allDhikrList = useSelector(
    (state: any) =>
      state.dhikr.dhikrs.find((x: {id: number}) => x.id === DhikrTabKeys.Prayer)
        .dhikrList,
  );
  useEffect(() => {
    console.log('allDhikrList', allDhikrList);
  }, []);
  return (
    <View>
      <View style={styles.container}>
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
      </View>
      <SubmitButton label="Sıfırla" onSubmit={() => dispatch(resetPrayerDhikr())} />
    </View>
  );
};

export default PrayerDhikr;
