import {StyleSheet} from 'react-native';
import {horizontalScale, scaleFontSize, verticalScale} from '../../core/utils';

export const style = StyleSheet.create({
  container: {
    flexDirection: 'column',
    marginTop: verticalScale(20),
    marginHorizontal: horizontalScale(16),
  },
  cardContainer: {
    height: 'auto',
    borderRadius: 10,
    paddingVertical: verticalScale(5),
  },
  title: {
    marginBottom: verticalScale(10),
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
