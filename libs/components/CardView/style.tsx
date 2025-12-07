import { StyleSheet } from 'react-native';

export const style = StyleSheet.create({
  container: {
    flexDirection: 'column',
    marginHorizontal: 20,
    marginTop: 20,
  },
  cardContainer: {
    height: 'auto',
    borderRadius: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shadow: {
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2, // Android için gerekli
  },
});
