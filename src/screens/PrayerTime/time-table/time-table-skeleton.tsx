import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SkeletonPlaceholder } from '../../../../libs/components';
import { useTheme } from '../../../../libs/core/providers';

const sectionPlaceholders = Array.from({ length: 2 });
const rowsPerSection = Array.from({ length: 3 });

const TimeTableSkeleton: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      {sectionPlaceholders.map((_, sectionIndex) => (
        <View key={sectionIndex}>
          <View
            style={[
              styles.headerCard,
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
          >
            <SkeletonPlaceholder>
              <SkeletonPlaceholder.Item
                width={180}
                height={22}
                borderRadius={12}
              />
            </SkeletonPlaceholder>
          </View>

          {rowsPerSection.map((__, rowIndex) => (
            <View style={styles.rowWrapper} key={`${sectionIndex}-${rowIndex}`}>
              <View
                style={[
                  styles.rowCard,
                  { backgroundColor: currentTheme.cardViewBackgroundColor },
                ]}
              >
                <SkeletonPlaceholder>
                  <SkeletonPlaceholder.Item borderRadius={18} padding={16}>
                    <SkeletonPlaceholder.Item
                      width="60%"
                      height={16}
                      borderRadius={8}
                      marginBottom={12}
                    />
                    <SkeletonPlaceholder.Item
                      width="100%"
                      height={1}
                      borderRadius={1}
                      marginBottom={14}
                    />
                    <SkeletonPlaceholder.Item gap={10}>
                      {[0, 1].map(row => (
                        <SkeletonPlaceholder.Item
                          key={row}
                          flexDirection="row"
                          justifyContent="space-between"
                          gap={8}
                        >
                          {Array.from({ length: 6 }).map((_, cellIndex) => (
                            <SkeletonPlaceholder.Item
                              key={cellIndex}
                              width="14%"
                              height={row === 0 ? 12 : 16}
                              borderRadius={6}
                            />
                          ))}
                        </SkeletonPlaceholder.Item>
                      ))}
                    </SkeletonPlaceholder.Item>
                  </SkeletonPlaceholder.Item>
                </SkeletonPlaceholder>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rowWrapper: {
    marginTop: 12,
  },
  rowCard: {
    borderRadius: 18,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
});

export default TimeTableSkeleton;
