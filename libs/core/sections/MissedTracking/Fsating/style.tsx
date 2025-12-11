import { StyleSheet } from 'react-native';

export const createStyles = (fontScaleMultiplier: number) =>
  StyleSheet.create({
    smallInput: {
      textAlign: 'center',
      flex: 0.2,
      borderRadius: 5,
      fontSize: 16 * fontScaleMultiplier,
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
    paddingLeft: 10,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
    label: {
      flex: 0.7,
      fontSize: 16 * fontScaleMultiplier,
    },
  infoIcon: {
    marginLeft: 5,
  },
  calculatedMissedPrayerRightContainer: {
    flexDirection: 'row',
    flex: 0.7,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  calculatedMissedPrayerProgress: { overflow: 'hidden' },
    bottomDescription: {
      textAlign: 'right',
      marginTop: 5,
      marginRight: 5,
      fontSize: 12 * fontScaleMultiplier,
    },
  errorMessageStyle: {
    margin: 25,
  },
  calculatedMissedPrayerBottomDescription: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  bottomDescriptionText: {
    textAlign: 'center',
  },
  });
