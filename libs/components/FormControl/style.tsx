import { StyleSheet } from 'react-native';

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
    marginLeft: 5,
  },
  renderContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

export default styles;
