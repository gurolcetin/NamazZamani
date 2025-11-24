import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
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
  const [cardWidth, setCardWidth] = useState(0);

  const allDhikrList = useSelector(
    (state: any) =>
      state.dhikr.dhikrs.find(
        (x: { id: number }) => x.id === DhikrTabKeys.Prayer,
      ).dhikrList,
  );

  const circleSize = useMemo(() => {
    if (!cardWidth) {
      return 75;
    }

    const computedSize = cardWidth / 4 - 24; // CircleProgressBar extra padding is ~24px
    const minSize = 60;
    const maxSize = 90;

    return Math.min(maxSize, Math.max(minSize, computedSize));
  }, [cardWidth]);

  const handleCardLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setCardWidth(event.nativeEvent.layout.width);
    },
    [setCardWidth],
  );

  return (
    <View>
      <CardView cardStyle={styles.prayerDhikrCard} paddingLeft={0} shadow>
        <View style={styles.dhikrGrid} onLayout={handleCardLayout}>
          {allDhikrList.map(
            (item: {
              dhikrId: number;
              name: string;
              count: number;
              maxCount: number;
            }) => {
              return (
                <View key={item.dhikrId} style={styles.dhikrItem}>
                  <CircleProgressBar
                    progress={(item.count / item.maxCount) * 100}
                    size={circleSize}
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
                </View>
              );
            },
          )}
        </View>
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
