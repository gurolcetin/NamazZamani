import {StyleSheet} from 'react-native';
import {verticalScale} from '../../core/utils';

const style = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(40),
    marginBottom: verticalScale(15),
  },
  touchableOpacity: {
    width: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default style;
