import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  prayerDhikrCard: {
    paddingVertical: 20,
  },
  dhikrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dhikrItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 12,
  },
  containerSingleDhikr: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  containerSingleDhikrCompact: {
    paddingVertical: 16,
  },
  smallInput: {
    textAlign: 'center',
    flex: 0.2,
    borderRadius: 5,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dhikrAddButtonContainer: {
    flex: 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhikrAddButton: {
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  radioRowCompact: {
    paddingTop: 6,
    paddingBottom: 0,
  },
  radioScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioScroll: {
    flex: 0.85,
  },
  radioButtonStyle: {
    width: 120,
    height: 40,
  },
  dhikrActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 25,
    marginTop: 15,
  },
  dhikrActionRowCompact: {
    marginTop: 10,
  },
  deleteResetButtonStyle: {
    marginTop: 12,
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '49%',
    borderWidth: 1,
  },
  deleteResetButtonCompact: {
    paddingVertical: 8,
  },
  addDhikrButton: {
    marginHorizontal: 25,
    marginTop: 30,
  },
  formSpacer: {
    marginVertical: 5,
  },
  inputFlex: {
    flex: 1,
  },
  emptyStateContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  emptyStateCard: {
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },

  emptyStateButton: {
    marginTop: 24,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  emptyStateButtonPrayer: {
    marginTop: 24,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dhikrChip: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 8,
  },

  dhikrChipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dhikrAddFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  dhikrAddFabText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '600',
    marginTop: -1, // optik hizalama
  },
  dhikrAddFabNeo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteResetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;
