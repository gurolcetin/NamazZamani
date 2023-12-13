import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 15,
    padding: 7,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  animatedView: {
    left: 0,
    height: '100%',
    borderRadius: 10,
    position: 'absolute',
    margin: 7,
  },
});

export default styles;
