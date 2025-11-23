import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 6,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false as any,
  },
  animatedView: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 20,
  },
  tabButton: {
    height: 38,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default styles;
