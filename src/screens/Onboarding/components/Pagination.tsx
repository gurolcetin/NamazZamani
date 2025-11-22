import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface Props {
  data: any[];
  scrollX: Animated.Value;
  width: number;
  activeColor: string;
  inactiveColor: string;
}

const Pagination: React.FC<Props> = ({ data, scrollX, width, activeColor, inactiveColor }) => {
  return (
    <View style={styles.container}>
      {data.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 18, 8],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index.toString()}
            style={[
              styles.dot,
              {
                width: dotWidth,
                backgroundColor: activeColor,
                opacity,
                borderColor: inactiveColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dot: {
    height: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 4,
  },
});

export default Pagination;
