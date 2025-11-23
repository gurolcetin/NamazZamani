import { StyleSheet } from 'react-native';
import {
  horizontalScale,
  scaleFontSize,
  verticalScale,
} from '../../core/utils';

export const style = StyleSheet.create({
  container: {
    flexDirection: 'column',
    marginHorizontal: horizontalScale(20),
    marginTop: verticalScale(20),
  },
  cardContainer: {
    height: 'auto',
    borderRadius: 30,
  },
  title: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  shadow: {
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2, // Android için gerekli
  },
});
