import {StyleSheet} from 'react-native';
import {horizontalScale, verticalScale} from '../../core/utils';

const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: verticalScale(5),
    alignItems: 'center',
  },
  errorMessage: {
    marginLeft: horizontalScale(5),
  },
});

export default style;
