import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 3,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  animatedView: {
    left: 0,
    height: '100%',
    borderRadius: 7,
    position: 'absolute',
    margin: 3,
  },
});

export default styles;
