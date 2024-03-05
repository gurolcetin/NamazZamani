import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {DhikrTabKeys} from '../../../common/constants';
import {CircleProgressBar, SubmitButton} from '../../../components';
import styles from './style';
import {resetDhikrByItem, updateDhikr} from '../../../redux/reducers/Dhikr';

const AllDhikr = () => {
  const dispatch = useDispatch();
  const allDhikrList = useSelector(
    (state: any) =>
      state.dhikr.dhikrs.find((x: {id: number}) => x.id === DhikrTabKeys.All)
        .dhikrList,
  );
  useEffect(() => {
    console.log('allDhikrList', allDhikrList);
  }, []);
  return (
    <View style={styles.containerSingleDhikr}>
      {allDhikrList.map(
        (item: {
          dhikrId: number;
          name: string;
          count: number;
          maxCount: number;
        }) => {
          return (
            <>
              <CircleProgressBar
                key={item.dhikrId}
                progress={(item.count / item.maxCount) * 100}
                size={150}
                count={item.count}
                maxCount={item.maxCount}
                incraseValue={() => {
                  dispatch(
                    updateDhikr({
                      id: DhikrTabKeys.All,
                      dhikrId: item.dhikrId,
                    }),
                  );
                }}
              />
              <SubmitButton
                label="Sıfırla"
                onSubmit={() => dispatch(resetDhikrByItem({dhikrId: 1}))}
              />
            </>
          );
        },
      )}
    </View>
  );
};

export default AllDhikr;
