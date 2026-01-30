import { Dimensions, PixelRatio } from 'react-native';

const { width } = Dimensions.get('window');

// Reference width (Android standard)
const guidelineBaseWidth = 375;

export const scale = size => (width / guidelineBaseWidth) * size;

export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const fontScale = size =>
  size * PixelRatio.getFontScale();
