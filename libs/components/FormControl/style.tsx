import {StyleSheet} from 'react-native';
import {horizontalScale} from '../../core/utils';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    flex: 0.7,
  },
  infoIcon: {
    marginLeft: horizontalScale(5),
  },
});

export default styles;
