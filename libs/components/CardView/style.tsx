import {StyleSheet} from 'react-native';
import {horizontalScale, verticalScale} from '../../core/utils';

export const style = StyleSheet.create({
  container: {
    height: 'auto',
    borderRadius: 15,
    marginTop: verticalScale(20),
    marginHorizontal: horizontalScale(10),
  },
});
