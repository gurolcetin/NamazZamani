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
    paddingVertical: 10,
    paddingHorizontal: 10,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  radioRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginRight: 20,
    marginLeft: 15,
  },
  radioScroll: {
    flex: 0.85,
  },
  radioButtonStyle: {
    width: 120,
    height: 30,
    borderWidth: 2,
  },
  dhikrActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 25,
    marginTop: 15,
  },
  deleteButtonStyle: {
    marginRight: 20,
  },
  addDhikrButton: {
    marginHorizontal: 25,
    marginTop: 30,
  },
  formSpacer: {
    marginVertical: 5,
  },
  inputFlex: {
    flex: 1,
  },
});

export default styles;
