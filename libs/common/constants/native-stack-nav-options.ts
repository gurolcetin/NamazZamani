import { ThemeType } from '../models';

export const defaultNativeStackNavOptions = (
  currentTheme: ThemeType,
  item: any,
) => ({
  headerShown: item.headerShown,
  headerBackVisible: item.headerShown,
  headerTitle: item.label,
  headerStyle: {
    backgroundColor: currentTheme.statusBarColor,
  },
  headerTintColor: currentTheme.textColor,
});
