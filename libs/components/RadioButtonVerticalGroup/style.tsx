import {StyleSheet} from 'react-native';
import {horizontalScale, verticalScale} from '../../core/utils';

export const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: verticalScale(10),
    paddingHorizontal: horizontalScale(20),
    paddingTop: verticalScale(10),
  },
  leftContainer: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
