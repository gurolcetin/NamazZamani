import { StyleSheet } from 'react-native';
import { ThemeType } from '../../../libs/common/models';

export const createStyles = (theme: ThemeType) =>
  StyleSheet.create({
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    headerSpacer: {
      width: 50,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '600',
      color: theme.textColor,
    },
    card: {
      borderRadius: 28,
      padding: 20,
      marginBottom: 20,
      backgroundColor: theme.cardViewBackgroundColor,
      shadowColor: theme.shadowColor,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textColor,
      marginBottom: 12,
    },
    languageButton: {
      borderRadius: 26,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    languageInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    flag: {
      width: 28,
      height: 20,
      borderRadius: 4,
      marginRight: 12,
    },
    languageText: {
      fontSize: 15,
      fontWeight: '600',
    },
    dropdown: {
      marginTop: 12,
      borderRadius: 22,
      overflow: 'hidden',
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dropdownDivider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 16,
    },
    themeSectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 10,
    },
    themeOptionsRow: {
      flexDirection: 'row',
      borderRadius: 26,
      padding: 6,
    },
    themeOption: {
      flex: 1,
      borderRadius: 22,
      paddingVertical: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    accentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    accentSwatchWrapper: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    accentSwatch: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
    },
    input: {
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: 14,
      fontSize: 16,
    },
    menstrualRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    menstrualInput: {
      flex: 1,
      marginRight: 12,
    },
    helperText: {
      marginTop: 10,
      fontSize: 13,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    toggleLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: theme.textColor,
      marginRight: 12,
    },
    toggleHint: {
      marginTop: 6,
      fontSize: 12,
      color: theme.gray,
    },
    saveButton: {
      borderRadius: 26,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    inlineSaveButton: {
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButtonLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });
