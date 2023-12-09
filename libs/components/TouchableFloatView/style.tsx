import {StyleSheet} from 'react-native';
import {horizontalScale} from '../../core/utils';

const style = StyleSheet.create({
  touchbaleOpacity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewContainer: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleViewContainer: {
    marginLeft: horizontalScale(10),
  },
  iconLeftViewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    padding: 5,
    width: 30,
    height: 30,
  },
  iconRightViewContainer: {
    flex: 0.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: horizontalScale(15),
  },
});

export default style;
