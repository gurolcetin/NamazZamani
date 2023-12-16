import {StyleSheet} from 'react-native';
import {horizontalScale} from '../../core/utils';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    flex: 0.3,
  },
  infoIcon: {
    marginLeft: horizontalScale(5),
  },
});

export default styles;
