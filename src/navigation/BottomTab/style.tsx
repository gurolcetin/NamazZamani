import {StyleSheet} from 'react-native';
import {Colors} from '../../../libs/constants';

const style = StyleSheet.create({
  tabBar: {
    height: '10%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.gray,
  },
});

export default style;
