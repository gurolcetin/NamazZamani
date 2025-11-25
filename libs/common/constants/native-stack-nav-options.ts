import { TFunction } from 'i18next';
import { ThemeType, LanguageModel } from '../models';

export const defaultNativeStackNavOptions = (
  currentTheme: ThemeType,
  item: { headerShown: boolean; label?: LanguageModel } & Record<
    string,
    any
  >,
  t: TFunction,
) => ({
  headerShown: item.headerShown,
  headerBackVisible: item.headerShown,
  headerTitle: item.label ? t(item.label.key) : undefined,
  headerTintColor: currentTheme.textColor,
});
