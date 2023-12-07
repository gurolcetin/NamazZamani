import {StyleSheet} from 'react-native';
import {Colors} from '../../constants';
import {scaleFontSize} from '../../utils/scaling';

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
    alignSelf: 'stretch',
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: scaleFontSize(10),
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    bottom: 20,
  },
  animatedView: {
    width: 50,
    height: 50,
    borderRadius: 100,
    position: 'absolute',
  },
});

export default style;
