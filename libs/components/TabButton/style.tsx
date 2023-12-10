import {StyleSheet} from 'react-native';
import {scaleFontSize} from '../../core/utils/scaling';

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    alignSelf: 'stretch',
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: scaleFontSize(10),
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    bottom: 5,
  },
  animatedView: {
    width: 50,
    height: 50,
    borderRadius: 100,
    position: 'absolute',
  },
});

export default style;
