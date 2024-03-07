import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  containerSingleDhikr: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  smallInput: {
    textAlign: 'center',
    flex: 0.2,
    borderRadius: 5,
    fontSize: 16,
    paddingVertical: 3,
  },
  dhikrAddButtonContainer: {
    flex: 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhikrAddButton: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});

export default styles;
