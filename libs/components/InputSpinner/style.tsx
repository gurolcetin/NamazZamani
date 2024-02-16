import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    margin: 10,
  },
  increaseDecreaseButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  increaseDecreaseButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  valueText: {
    marginHorizontal: 15,
    fontSize: 16,
    alignItems: 'center',
    alignSelf: 'center',
  },
});

export default styles;
