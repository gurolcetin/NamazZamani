import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  DhikrTabKeys,
  GeneralLanguageConstants,
  HapticFeedbackMethods,
} from '../../../common/constants';
import { FontScaleOption } from '../../../common/enums';
import { CardView, CircleProgressBar } from '../../../components';
import styles from './style';
import { resetPrayerDhikr, updateDhikr } from '../../../redux/reducers/Dhikr';
import { getFontScaleMultiplier, hapticFeedback } from '../../helpers';
import { useTheme } from '../../providers';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../redux/store';

const PrayerDhikr = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentTheme } = useTheme();
  const [cardWidth, setCardWidth] = useState(0);
  const fontScalePreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);

  const allDhikrList = useSelector(
    (state: RootState) =>
      state.dhikr.dhikrs.find(
        (x: { id: number }) => x.id === DhikrTabKeys.Prayer,
      ).dhikrList,
  );

  const circleSize = useMemo(() => {
    if (!cardWidth) {
      return 75 * fontScaleMultiplier;
    }

    const computedSize = cardWidth / 4 - 24; // CircleProgressBar extra padding is ~24px
    const minSize = 60;
    const maxSize = 90;
    const baseSize = Math.min(maxSize, Math.max(minSize, computedSize));

    return baseSize * fontScaleMultiplier;
  }, [cardWidth, fontScaleMultiplier]);

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
        <Text
          style={[
            styles.emptyStateButtonText,
            { fontSize: 16 * fontScaleMultiplier },
          ]}
        >
          {t(GeneralLanguageConstants.Reset.key).toLocaleUpperCase()}
        </Text>
      </Pressable>
    </View>
  );
};

export default PrayerDhikr;
