import {StyleSheet} from 'react-native';
import {horizontalScale, scaleFontSize, verticalScale} from '../../core/utils';

export const style = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    marginTop: verticalScale(20),
    marginHorizontal: horizontalScale(10),
  },
  cardContainer: {
    height: 'auto',
    borderRadius: 15,
  },
  title: {
    marginBottom: verticalScale(10),
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});
