import store, { RootState } from '../../redux/store';
import { FontScaleOption } from '../../common/enums';

const FONT_SCALE_MULTIPLIERS: Record<FontScaleOption, number> = {
  [FontScaleOption.SMALL]: 0.9,
  [FontScaleOption.MEDIUM]: 1,
  [FontScaleOption.LARGE]: 1.1,
  [FontScaleOption.EXTRA_LARGE]: 1.2,
};

export const getFontScalePreference = (
  state?: RootState,
): FontScaleOption => {
  const sourceState = state ?? store.getState();
  return (
    sourceState?.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM
  );
};

export const getFontScaleMultiplier = (
  preference: FontScaleOption,
): number => FONT_SCALE_MULTIPLIERS[preference] ?? 1;

export const getScaledFontSize = (
  baseFontSize: number,
  state?: RootState,
): number => {
  const preference = getFontScalePreference(state);
  return baseFontSize * getFontScaleMultiplier(preference);
};
