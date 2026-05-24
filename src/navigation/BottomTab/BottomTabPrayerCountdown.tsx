import React, { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { FontScaleOption } from '../../../libs/common/enums';
import type { PrayerTimeKey } from '../../../libs/common/types';
import { getFontScaleMultiplier } from '../../../libs/core/helpers';
import { useTheme } from '../../../libs/core/providers';
import { selectPrayerSnapshot } from '../../../libs/redux/reducers/prayerTimesCache';
import type { RootState } from '../../../libs/redux/store';
import type { PrayerTimings } from '../../screens/PrayerTime/api';

const PRAYER_ORDER: PrayerTimeKey[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

type SequenceItem = {
  key: PrayerTimeKey;
  date: Date;
};

const MAX_SPAN_SEC = 24 * 60 * 60;

function toTodayDate(hhmm: string, base = new Date()): Date | null {
  const [hRaw, mRaw] = hhmm.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return null;
  }

  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function buildSequence(
  timings: PrayerTimings,
  baseDate: Date = new Date(),
): SequenceItem[] {
  return PRAYER_ORDER.reduce<SequenceItem[]>((acc, key) => {
    const time = timings[key];
    const date = typeof time === 'string' ? toTodayDate(time, baseDate) : null;
    if (date) {
      acc.push({ key, date });
    }
    return acc;
  }, []);
}

function computeLeftSeconds(
  timings: PrayerTimings | null,
  now: Date = new Date(),
): number | null {
  if (!timings) {
    return null;
  }

  const sequence = buildSequence(timings, now);
  if (sequence.length < 2) {
    return null;
  }

  for (let i = 0; i < sequence.length; i++) {
    if (now < sequence[i].date) {
      const leftSec = (sequence[i].date.getTime() - now.getTime()) / 1000;
      return Math.max(0, Math.min(leftSec, MAX_SPAN_SEC));
    }
  }

  const first = sequence[0];
  const firstTomorrow = new Date(first.date);
  firstTomorrow.setDate(firstTomorrow.getDate() + 1);
  const leftSec = (firstTomorrow.getTime() - now.getTime()) / 1000;
  return Math.max(0, Math.min(leftSec, MAX_SPAN_SEC));
}

function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    sec,
  ).padStart(2, '0')}`;
}

const BottomTabPrayerCountdown = memo(() => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const prayerSnapshot = useSelector((state: RootState) =>
    selectPrayerSnapshot(state),
  );
  const fontScalePreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = useMemo(
    () => getFontScaleMultiplier(fontScalePreference),
    [fontScalePreference],
  );

  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    computeLeftSeconds(prayerSnapshot.timings, new Date()),
  );

  useEffect(() => {
    const tick = () => {
      setSecondsLeft(computeLeftSeconds(prayerSnapshot.timings, new Date()));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [prayerSnapshot.timings]);

  const countdownText =
    secondsLeft == null ? '--:--:--' : fmtClock(secondsLeft);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: currentTheme.primary,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: currentTheme.activeTabTextColor,
            fontSize: 14 * fontScaleMultiplier,
          },
        ]}
      >
        {t('prayerTime.bottomTabTimeLeftLabel')}
      </Text>

      <Text
        style={[
          styles.value,
          {
            color: currentTheme.activeTabTextColor,
            fontSize: 16 * fontScaleMultiplier,
          },
        ]}
      >
        {countdownText}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  label: {
    flex: 1,
    marginRight: 10,
    fontWeight: '500',
    opacity: 0.95,
  },
  value: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    minWidth: 84,
  },
});

BottomTabPrayerCountdown.displayName = 'BottomTabPrayerCountdown';

export default BottomTabPrayerCountdown;
