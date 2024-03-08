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
  shadow: {
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5, // Android için gerekli
  },
});
