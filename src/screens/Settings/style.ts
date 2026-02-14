import { StyleSheet } from 'react-native';
import { ThemeType } from '../../../libs/common/models';

export const createStyles = (theme: ThemeType, fontScale = 1) => {
  const scaleFont = (value: number) => value * fontScale;

  return StyleSheet.create({
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
      fontSize: scaleFont(20),
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
      fontSize: scaleFont(17),
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 16,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    notificationHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    notificationIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${theme.gray}11`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationHeaderTexts: {
      flex: 1,
    },
    notificationHeaderTitle: {
      fontSize: scaleFont(16),
      fontWeight: '600',
      color: theme.textColor,
      marginBottom: 2,
    },
    notificationSubtitle: {
      fontSize: scaleFont(13),
      lineHeight: scaleFont(18),
      color: theme.gray,
    },
    notificationHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    notificationChip: {
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      backgroundColor: `${theme.primary}15`,
      borderWidth: 1,
      borderColor: `${theme.primary}33`,
    },
    notificationChipText: {
      fontSize: scaleFont(13),
      fontWeight: '600',
      color: theme.primary,
    },
    collapsibleContent: {
      marginTop: 18,
    },
    notificationGrid: {
      marginTop: 18,
      gap: 12,
    },
    notificationRow: {
      flexDirection: 'row',
      gap: 12,
    },
    notificationCell: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: `${theme.gray}22`,
      backgroundColor: `${theme.primary}08`,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    notificationCellPlaceholder: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    notificationLabel: {
      fontSize: scaleFont(15),
      fontWeight: '500',
      color: theme.textColor,
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
      height: 28,
      borderRadius: 4,
      marginRight: 12,
      resizeMode: 'contain'
    },
    languageText: {
      fontSize: scaleFont(15),
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
      fontSize: scaleFont(13),
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
      fontSize: scaleFont(14),
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
    helperText: {
      marginTop: 10,
      fontSize: scaleFont(13),
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    toggleLabel: {
      flex: 1,
      fontSize: scaleFont(14),
      fontWeight: '500',
      color: theme.textColor,
      marginRight: 12,
    },
    toggleHint: {
      marginTop: 6,
      fontSize: scaleFont(12),
      color: theme.gray,
    },
    saveButton: {
      borderRadius: 26,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    saveButtonLabel: {
      fontSize: scaleFont(16),
      fontWeight: '600',
      color: '#fff',
    },
    debugContainer: {
      marginTop: 14,
      borderTopWidth: 1,
      borderTopColor: `${theme.gray}22`,
      paddingTop: 14,
      gap: 8,
    },
    debugButton: {
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    debugButtonLabel: {
      fontSize: scaleFont(13),
      fontWeight: '600',
      color: theme.textColor,
    },
    debugHint: {
      fontSize: scaleFont(11),
      color: theme.gray,
    },
    debugItem: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.gray}33`,
      backgroundColor: `${theme.gray}10`,
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 4,
    },
    debugKey: {
      fontSize: scaleFont(11),
      fontWeight: '600',
      color: theme.textColor,
    },
    debugValue: {
      fontSize: scaleFont(11),
      color: theme.gray,
    },
    debugMeta: {
      fontSize: scaleFont(11),
      color: theme.textColor,
    },
    debugEmpty: {
      fontSize: scaleFont(12),
      color: theme.gray,
      fontStyle: 'italic',
    },
    versionInfoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    versionInfoLabel: {
      fontSize: scaleFont(13),
      color: theme.gray,
      marginBottom: 4,
    },
    versionInfoValue: {
      fontSize: scaleFont(16),
      fontWeight: '600',
      color: theme.textColor,
    },
  });
};
