import {Dimensions} from 'react-native';
import DeviceInfo from 'react-native-device-info';

// Get the device's screen dimensions
const {width, height} = Dimensions.get('window');

const getWidth = () => {
  return width > height ? height : width;
};
const getHeight = () => {
  return height > width ? width : height;
};

// Check if the device is small (e.g. iPhone 5, SE, etc.)
const isSmall = getWidth() <= 375 && !DeviceInfo.hasNotch();

// Define the guideline base width based on whether the device is small or not
const guidelineBaseWidth = () => {
  if (isSmall) {
    // if device is small, return 330 (fit older iPhones such as the iPhone 5/5S/SE)
    return 330;
  }
  return 350; // if device is not small, return 350
};

// Define the guideline base height based on the device's width
const guidelineBaseHeight = () => {
  if (isSmall) {
    // if device is small, return 550 (enough vertical space without taking up too much screen real estate)
    return 550;
  } else if (getWidth() > 410) {
    // if device width is greater than 410 (close to iPhone 6/7/8 Plus width), return 620 (enough vertical space without making the UI feel cramped)
    return 620;
  }
  return 680; // if device width is less than or equal to 410, return 680 (appropriate for devices with even wider screens, such as some Android phones)
};

// Define the guideline base font size based on the device's width
const guidelineBaseFonts = () => {
  if (getWidth() > 410) {
    // if device width is greater than 410 (close to iPhone 6/7/8 Plus width), return 430
    return 430;
  }
  return 400; // if device width is less than or equal to 410, return 400
};

// Function to scale a size horizontally based on the device's width
const horizontalScale = (size: any) =>
  (getWidth() / guidelineBaseWidth()) * size;

// Function to scale a size vertically based on the device's height
const verticalScale = (size: any) =>
  (getHeight() / guidelineBaseHeight()) * size;

// Function to scale a font size based on the device's width
const scaleFontSize = (size: any) =>
  Math.round((size * getWidth()) / guidelineBaseFonts());

// Export the scaling functions for use in other modules
export {horizontalScale, verticalScale, scaleFontSize};
