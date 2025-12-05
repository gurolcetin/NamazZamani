/**
 * Pure TypeScript helpers that evaluate whether the app should prompt users for an update.
 */

export type UpdateType = 'none' | 'optional' | 'force';

export interface OptionalUpdateMessage {
  title: string;
  body: string;
  confirm: string;
  cancel: string;
}

export interface ForceUpdateMessage {
  title: string;
  body: string;
  confirm: string;
}

/**
 * Allows remote config to define different thresholds per update behaviour.
 * Versions below `force` are unsupported, below `optional` (but above force)
 * will see an optional prompt, and everything beyond falls back to `none`.
 */
export interface VersionedUpdateRules {
  force?: string;
  optional?: string;
  none?: string;
}

export interface RemoteConfig {
  minSupportedVersion: string | VersionedUpdateRules;
  updateType?: UpdateType;
  storeUrlAndroid?: string;
  storeUrliOS?: string;
  messages: {
    optional: Record<string, OptionalUpdateMessage>;
    force: Record<string, ForceUpdateMessage>;
  };
}

export type Platform = 'android' | 'ios';

export type UpdateDecisionType = 'none' | 'optional' | 'force' | 'unsupported';

export interface UpdateMessage {
  title: string;
  body: string;
  confirm: string;
  cancel?: string;
}

export interface UpdateDecision {
  type: UpdateDecisionType;
  message?: UpdateMessage;
  storeUrl?: string;
}

const FALLBACK_LANGUAGE = 'en';

const isVersionedRules = (
  value: string | VersionedUpdateRules,
): value is VersionedUpdateRules =>
  typeof value === 'object' && value !== null;

const normalizeVersionRules = (
  value: string | VersionedUpdateRules,
  defaultType: UpdateType,
): VersionedUpdateRules => {
  if (isVersionedRules(value)) {
    return value;
  }

  if (defaultType === 'optional') {
    return { optional: value };
  }

  if (defaultType === 'none') {
    return { none: value };
  }

  return { force: value };
};

const normalizeVersion = (version: string): number[] | null => {
  if (typeof version !== 'string') {
    return null;
  }

  const segments = version.split('.');
  if (segments.length === 0) {
    return null;
  }

  const parsedSegments = segments.map(segment => {
    if (segment.trim() === '') {
      return NaN;
    }
    const numeric = Number(segment);
    return Number.isFinite(numeric) ? numeric : NaN;
  });

  return parsedSegments.some(value => Number.isNaN(value))
    ? null
    : parsedSegments;
};

/**
 * Compares two semantic versions with safe fallbacks for malformed values.
 */
export const compareVersions = (a: string, b: string): number => {
  const parsedA = normalizeVersion(a);
  const parsedB = normalizeVersion(b);

  if (!parsedA || !parsedB) {
    return 0;
  }

  const maxLength = Math.max(parsedA.length, parsedB.length);

  for (let i = 0; i < maxLength; i += 1) {
    const valueA = parsedA[i] ?? 0;
    const valueB = parsedB[i] ?? 0;

    if (valueA > valueB) {
      return 1;
    }
    if (valueA < valueB) {
      return -1;
    }
  }

  return 0;
};

const normalizeLanguageCode = (languageCode: string): string => {
  if (!languageCode) {
    return FALLBACK_LANGUAGE;
  }

  const trimmed = languageCode.trim();
  return trimmed ? trimmed.toLowerCase() : FALLBACK_LANGUAGE;
};

const pickLanguageMessage = <T>(
  dictionary: Record<string, T> | undefined,
  languageCode: string,
): T | undefined => {
  if (!dictionary) {
    return undefined;
  }

  const normalized = normalizeLanguageCode(languageCode);
  const baseLanguage = normalized.split('-')[0];

  return (
    dictionary[normalized] ??
    dictionary[baseLanguage] ??
    dictionary[FALLBACK_LANGUAGE]
  );
};

const getStoreUrl = (
  platform: Platform,
  config: RemoteConfig,
): string | undefined =>
  platform === 'android' ? config.storeUrlAndroid : config.storeUrliOS;

const toOptionalUpdateMessage = (
  message?: OptionalUpdateMessage,
): UpdateMessage | undefined => {
  if (!message) {
    return undefined;
  }

  return {
    title: message.title,
    body: message.body,
    confirm: message.confirm,
    cancel: message.cancel,
  };
};

const toForceUpdateMessage = (
  message?: ForceUpdateMessage,
): UpdateMessage | undefined => {
  if (!message) {
    return undefined;
  }

  return {
    title: message.title,
    body: message.body,
    confirm: message.confirm,
  };
};

/**
 * Evaluates which update prompt (if any) should be shown to the user.
 */
const parseUpdateType = (value?: string): UpdateType => {
  if (!value) {
    return 'none';
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'optional' || normalized === 'force') {
    return normalized;
  }

  return 'none';
};

export const evaluateUpdate = (
  appVersion: string,
  languageCode: string,
  platform: Platform,
  config: RemoteConfig,
): UpdateDecision => {
  try {
    if (!config || !appVersion) {
      return { type: 'none' };
    }

    const storeUrl = getStoreUrl(platform, config);
    const messageGroups = config.messages || { optional: {}, force: {} };
    const optionalMessages = messageGroups.optional || {};
    const forceMessages = messageGroups.force || {};
    const updateTypeRaw = config.updateType;
    const updateType = parseUpdateType(updateTypeRaw);
    const thresholdBehavior =
      typeof updateTypeRaw === 'undefined' ? 'force' : updateType;

    const versionRules = normalizeVersionRules(
      config.minSupportedVersion,
      thresholdBehavior,
    );
    const { force: forceThreshold, optional: optionalThreshold, none: noneThreshold } =
      versionRules;

    const buildForceDecision = (type: UpdateDecisionType = 'force'): UpdateDecision => ({
      type,
      message: toForceUpdateMessage(
        pickLanguageMessage(forceMessages, languageCode),
      ),
      storeUrl,
    });

    const buildOptionalDecision = (): UpdateDecision => ({
      type: 'optional',
      message: toOptionalUpdateMessage(
        pickLanguageMessage(optionalMessages, languageCode),
      ),
      storeUrl,
    });

    if (forceThreshold && compareVersions(appVersion, forceThreshold) < 0) {
      return buildForceDecision('unsupported');
    }

    if (optionalThreshold && compareVersions(appVersion, optionalThreshold) < 0) {
      return buildOptionalDecision();
    }

    if (noneThreshold && compareVersions(appVersion, noneThreshold) < 0) {
      return { type: 'none' };
    }

    if (updateType === 'optional') {
      return buildOptionalDecision();
    }

    if (updateType === 'force') {
      return buildForceDecision('force');
    }

    return { type: 'none' };
  } catch (error) {
    console.warn('evaluateUpdate failed', error);
    return { type: 'none' };
  }
};
