import {StyleSheet} from 'react-native';
import {verticalScale} from '../../core/utils';

const style = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  touchableOpacity: {
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(5),
    borderRadius: 10,
  },
});

export default style;
