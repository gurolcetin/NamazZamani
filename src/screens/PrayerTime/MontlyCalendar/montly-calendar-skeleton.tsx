import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonPlaceholder } from '../../../../libs/components';
import { useTheme } from '../../../../libs/core/providers';

const placeholderItems = Array.from({ length: 6 });

const MonthlyCalendarSkeleton: React.FC = () => {
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
          styles.card,
          { backgroundColor: currentTheme.cardViewBackgroundColor },
        ]}
      >
        <SkeletonPlaceholder>
          <SkeletonPlaceholder.Item padding={16}>
            <SkeletonPlaceholder.Item
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              marginBottom={16}
            >
              <SkeletonPlaceholder.Item width={80} height={32} borderRadius={12} />
              <SkeletonPlaceholder.Item
                flex={1}
                height={20}
                borderRadius={8}
                marginHorizontal={12}
              />
              <SkeletonPlaceholder.Item width={80} height={32} borderRadius={12} />
            </SkeletonPlaceholder.Item>
            <SkeletonPlaceholder.Item height={220} borderRadius={24} />
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder>
      </View>

      <View style={styles.sectionHeader}>
        <SkeletonPlaceholder>
          <SkeletonPlaceholder.Item width={160} height={18} borderRadius={8} />
        </SkeletonPlaceholder>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridRow}>
          {placeholderItems.map((_, index) => (
            <View
              key={index}
              style={[
                styles.gridCard,
                { backgroundColor: currentTheme.cardViewBackgroundColor },
              ]}
            >
              <SkeletonPlaceholder>
                <SkeletonPlaceholder.Item
                  padding={12}
                  borderRadius={18}
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  card: {
    marginTop: 16,
    borderRadius: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  grid: {
    paddingHorizontal: 4,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
});

export default MonthlyCalendarSkeleton;
