import {Dimensions} from 'react-native';

const getWidth = () => {
  let width = Dimensions.get('window').width;
  return width;
};

export {getWidth};
