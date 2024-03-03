import {StyleSheet} from 'react-native';
import {horizontalScale, scaleFontSize} from '../../../utils';

const styles = StyleSheet.create({
  smallInput: {
    textAlign: 'center',
    flex: 0.2,
    borderRadius: 5,
    fontSize: 16,
    paddingVertical: 3,
  },
  flex05: {
    flex: 0.5,
  },
  dateTimePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    padding: 8,
  },
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingLeft: horizontalScale(10),
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    flex: 0.7,
    fontSize: scaleFontSize(16),
  },
  infoIcon: {
    marginLeft: horizontalScale(5),
  },
  calculatedMissedPrayerRightContainer: {
    flexDirection: 'row',
    flex: 0.7,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  calculatedMissedPrayerProgress: {overflow: 'hidden'},
  bottomDescription: {
    textAlign: 'right',
    marginTop: 5,
    marginRight: 5,
    fontSize: scaleFontSize(12),
  },
  errorMessageStyle: {
    margin: 25,
  },
  calculatedMissedPrayerBottomDescription: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});

export default styles;
