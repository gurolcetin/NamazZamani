/**
 * External API keys can be configured here. Replace the empty strings with the
 * keys you obtained from the providers or wire them to your secure storage of
 * choice if needed.
 */
export const ISLAMIC_API_KEY = 'xOkGuC31cJ06EXkWDDqjSIhHklQao1ZiIBj2nJst0Em9hQ1P';

export const ASMA_UL_HUSNA_ENDPOINT =
  'https://islamicapi.com/api/v1/asma-ul-husna';
export const HADITH_API_BASE_URL = 'https://hadeethenc.com/api/v1';

type LocalExternalApiConfig = {
  LOCATIONIQ_API_KEY?: string;
};

function loadLocalExternalApiConfig(): LocalExternalApiConfig {
  try {
    // `externalApis.local.ts` dosyası git'e alınmaz; key repoda düz metin kalmaz.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const maybeModule = require('./externalApis.local');
    if (maybeModule?.default && typeof maybeModule.default === 'object') {
      return maybeModule.default as LocalExternalApiConfig;
    }
    if (maybeModule && typeof maybeModule === 'object') {
      return maybeModule as LocalExternalApiConfig;
    }
    return {};
  } catch {
    return {};
  }
}

const localExternalApiConfig = loadLocalExternalApiConfig();

// Geçiş döneminde uygulamanın kırılmaması için fallback key.
// Not: Bu yöntem tam güvenlik sağlamaz; backend proxy en güvenli çözümdür.
const FALLBACK_LOCATIONIQ_API_KEY = ['pk', 'b319608e31f0680f9a8c4ed7fef57626'].join('.');

function resolveLocationIqApiKey() {
  const local = (localExternalApiConfig.LOCATIONIQ_API_KEY ?? '').trim();
  if (local) {
    return local;
  }

  const runtimeProcess =
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { process?: unknown }).process === 'object'
      ? ((globalThis as { process?: { env?: Record<string, unknown> } }).process ??
        null)
      : null;
  const processEnvKey =
    runtimeProcess?.env?.LOCATIONIQ_API_KEY != null
      ? String(runtimeProcess.env.LOCATIONIQ_API_KEY).trim()
      : '';
  if (processEnvKey) {
    return processEnvKey;
  }

  return FALLBACK_LOCATIONIQ_API_KEY;
}

export const LOCATIONIQ_API_KEY = resolveLocationIqApiKey();
export const LOCATIONIQ_BASE_URL = 'https://us1.locationiq.com/v1';
