import {StyleSheet} from 'react-native';
import {horizontalScale, scaleFontSize, verticalScale} from '../../core/utils';

export const style = StyleSheet.create({
  container: {
    flexDirection: 'column',
    marginHorizontal: horizontalScale(20),
    marginTop: verticalScale(20),
  },
  cardContainer: {
    height: 'auto',
    borderRadius: 10,
  },
  title: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
