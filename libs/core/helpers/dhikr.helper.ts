export const getDhikrProgress = (dhikrCount: number, dhikrMaxCount: number) => {
  if (dhikrCount === 0) {
    return 0;
  } else if (dhikrCount % dhikrMaxCount === 0) {
    return 100;
  } else {
    return ((dhikrCount % dhikrMaxCount) / dhikrMaxCount) * 100;
  }
};

const PRAYER_DHIKR_KEY_PREFIX = 'Dhikr.prayerDhikrPresets.';

const LEGACY_PRAYER_DHIKR_NAME_TO_KEY: Record<string, string> = {
  Subhanallah: `${PRAYER_DHIKR_KEY_PREFIX}subhanallah`,
  'Sübhanallah': `${PRAYER_DHIKR_KEY_PREFIX}subhanallah`,
  'Subhanallah (Sübhanallah)': `${PRAYER_DHIKR_KEY_PREFIX}subhanallah`,
  Alhamdulillah: `${PRAYER_DHIKR_KEY_PREFIX}alhamdulillah`,
  Elhamdülillah: `${PRAYER_DHIKR_KEY_PREFIX}alhamdulillah`,
  'Alhamdulillah (Elhamdülillah)': `${PRAYER_DHIKR_KEY_PREFIX}alhamdulillah`,
  Allahuakbar: `${PRAYER_DHIKR_KEY_PREFIX}allahuAkbar`,
  'Allahu Akbar': `${PRAYER_DHIKR_KEY_PREFIX}allahuAkbar`,
  'Allahu Ekber': `${PRAYER_DHIKR_KEY_PREFIX}allahuAkbar`,
  'Allahu Akbar (Allahu Ekber)': `${PRAYER_DHIKR_KEY_PREFIX}allahuAkbar`,
};

export const resolveDhikrDisplayName = (
  rawName: string,
  t: (translationKey: string) => string,
) => {
  if (!rawName) {
    return rawName;
  }

  const translationKey = rawName.startsWith(PRAYER_DHIKR_KEY_PREFIX)
    ? rawName
    : LEGACY_PRAYER_DHIKR_NAME_TO_KEY[rawName];

  if (!translationKey) {
    return rawName;
  }

  return t(translationKey);
};
