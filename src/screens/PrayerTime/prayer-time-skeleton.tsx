import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonPlaceholder } from '../../../libs/components';
import { useTheme } from '../../../libs/core/providers';

const SMALL_CARD_PLACEHOLDERS = Array.from({ length: 6 });
const BUTTON_PLACEHOLDERS = Array.from({ length: 3 });
const INSPIRATION_PLACEHOLDERS = Array.from({ length: 3 });

const PrayerTimeSkeleton: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      <View
        style={[
          styles.locationCard,
          { backgroundColor: currentTheme.cardViewBackgroundColor },
        ]}
      >
        <SkeletonPlaceholder>
          <SkeletonPlaceholder.Item
            padding={16}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            gap={12}
          >
            <SkeletonPlaceholder.Item
              flexDirection="row"
              alignItems="center"
              gap={12}
            >
              <SkeletonPlaceholder.Item
                width={36}
                height={36}
                borderRadius={18}
              />
              <SkeletonPlaceholder.Item gap={8}>
                <SkeletonPlaceholder.Item
                  width={160}
                  height={16}
                  borderRadius={8}
                />
                <SkeletonPlaceholder.Item
                  width={120}
                  height={12}
                  borderRadius={6}
                />
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder.Item>
            <SkeletonPlaceholder.Item width={56} height={24} borderRadius={12} />
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder>
      </View>

      <View style={styles.actionButtonsRow}>
        {BUTTON_PLACEHOLDERS.map((_, index) => (
          <View
            key={`action-btn-${index}`}
            style={[
              styles.actionButtonCard,
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
          >
            <SkeletonPlaceholder>
              <SkeletonPlaceholder.Item
                padding={14}
                alignItems="center"
                gap={10}
              >
                <SkeletonPlaceholder.Item
                  width={36}
                  height={36}
                  borderRadius={18}
                />
                <SkeletonPlaceholder.Item
                  width="70%"
                  height={14}
                  borderRadius={7}
                />
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder>
          </View>
        ))}
      </View>

      <View style={styles.countdownCard}>
        <View
          style={[
            styles.countdownCard,
            { backgroundColor: currentTheme.cardViewBackgroundColor },
          ]}
        >
          <SkeletonPlaceholder>
            <SkeletonPlaceholder.Item padding={20} gap={16}>
              <SkeletonPlaceholder.Item
                width="40%"
                height={16}
                borderRadius={8}
              />
              <SkeletonPlaceholder.Item
                width="60%"
                height={36}
                borderRadius={18}
              />
              <SkeletonPlaceholder.Item
                width="50%"
                height={12}
                borderRadius={6}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder>
        </View>
      </View>
      <View style={styles.smallCardsGrid}>
        {SMALL_CARD_PLACEHOLDERS.map((_, index) => (
          <View
            key={`small-card-${index}`}
            style={[
              styles.smallCard,
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
          >
            <SkeletonPlaceholder>
              <SkeletonPlaceholder.Item
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                padding={14}
                borderRadius={18}
                gap={12}
              >
                <SkeletonPlaceholder.Item
                  width={36}
                  height={36}
                  borderRadius={18}
                />
                <SkeletonPlaceholder.Item
                  flex={1}
                  height={18}
                  borderRadius={8}
                />
                <SkeletonPlaceholder.Item
                  width={48}
                  height={18}
                  borderRadius={8}
                />
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder>
          </View>
        ))}
      </View>

      {INSPIRATION_PLACEHOLDERS.map((_, index) => (
        <View
          key={`inspiration-card-${index}`}
          style={[
            styles.inspirationCard,
            { backgroundColor: currentTheme.cardViewBackgroundColor },
          ]}
        >
          <SkeletonPlaceholder>
            <SkeletonPlaceholder.Item padding={16} gap={12}>
              <SkeletonPlaceholder.Item
                width="50%"
                height={16}
                borderRadius={8}
              />
              <SkeletonPlaceholder.Item
                width="80%"
                height={14}
                borderRadius={7}
              />
              <SkeletonPlaceholder.Item
                width="70%"
                height={14}
                borderRadius={7}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  locationCard: {
    borderRadius: 20,
    marginTop: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  actionButtonCard: {
    flex: 1,
    borderRadius: 18,
  },
  countdownCard: {
    borderRadius: 26,
    marginTop: 10,
    overflow: 'hidden',
  },
  smallCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  smallCard: {
    width: '48%',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  inspirationCard: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
  },
});

export default PrayerTimeSkeleton;
