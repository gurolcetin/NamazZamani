import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  DhikrTabKeys,
  GeneralLanguageConstants,
  HapticFeedbackMethods,
} from '../../../common/constants';
import { CardView, CircleProgressBar } from '../../../components';
import styles from './style';
import { resetPrayerDhikr, updateDhikr } from '../../../redux/reducers/Dhikr';
import { Translate, hapticFeedback } from '../../helpers';
import { useTheme } from '../../providers';

const PrayerDhikr = () => {
  const dispatch = useDispatch();
  const { currentTheme } = useTheme();

  const allDhikrList = useSelector(
    (state: any) =>
      state.dhikr.dhikrs.find(
        (x: { id: number }) => x.id === DhikrTabKeys.Prayer,
      ).dhikrList,
  );
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
      <Pressable
        style={[
          styles.emptyStateButtonPrayer,
          { backgroundColor: currentTheme.primary },
          
        ]}
        onPress={() => {
          dispatch(resetPrayerDhikr());
          hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
        }}
      >
        <Text style={styles.emptyStateButtonText}>
          {Translate(GeneralLanguageConstants.Reset).toLocaleUpperCase()}
        </Text>
      </Pressable>
    </View>
  );
};

export default PrayerDhikr;
