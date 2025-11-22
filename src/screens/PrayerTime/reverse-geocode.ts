// reverse-geocode.ts
export type PlaceParts = {
  city?: string;
  state?: string;
  county?: string;
  town?: string;
  village?: string;
  district?: string;
  suburb?: string;
  country_code?: string;
};

/**
 * LocationIQ için API key
 * Bunu ister burada, ister ayrı bir config dosyasında/Env'de tut.
 */
const LOCATIONIQ_API_KEY = 'pk.b319608e31f0680f9a8c4ed7fef57626';

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  console.log('📍 [LocationIQ] reverseGeocode() CALLED');
  console.log('➡️ Gelen koordinatlar:', { latitude, longitude });

  if (!LOCATIONIQ_API_KEY) {
    console.log('❌ [LocationIQ] API key tanımlı değil');
    return 'Bilinmeyen konum';
  }

  // LocationIQ endpoint
  const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&normalizeaddress=1&addressdetails=1&accept-language=tr,en`;

  console.log('🌍 [LocationIQ] Fetch URL:', url);

  try {
    const res = await fetch(url);

    console.log('📡 [LocationIQ] HTTP Status:', res.status);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log('❌ [LocationIQ] Response OK değil, body:', text);
      throw new Error(
        `LocationIQ reverse geocode failed. Status: ${res.status}`,
      );
    }

    const json = await res.json();
    console.log('✅ [LocationIQ] JSON response:', json);

    const a = json?.address || {};

    // 1️⃣ City-level alan
    const cityLike =
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      a.suburb ||
      a.hamlet ||
      a.locality ||
      a.county ||
      a.state_district;

    // 2️⃣ Üst idari alan (state / province / region sıralı)
    let adminLike = a.state || a.province || a.region || a.county || undefined;

    // 3️⃣ Çok geniş bölgeleri filtrele (Region, Bölgesi, Area, Zone vs.)
    if (adminLike && /(region|bölgesi|area|zone)/i.test(adminLike)) {
      adminLike = a.state || a.province || undefined;
    }

    // 4️⃣ Normalize ve tekrar kontrol
    let city = normalize(cityLike);
    let admin = normalize(adminLike);

    if (city && admin && city.toLowerCase() === admin.toLowerCase()) {
      admin = undefined;
    }

    // 5️⃣ Fallback — hiçbir şey yoksa ülkeyi kullan
    if (!city && !admin && a.country) {
      city = a.country;
    }

    const parts = [city, admin].filter(Boolean);
    const result = parts.length ? parts.join(', ') : 'Bilinmeyen konum';

    console.log('📌 [LocationIQ] Sonuç (city, admin):', {
      city,
      admin,
      result,
    });

    return result;
  } catch (err) {
    console.log('🔥 [LocationIQ] reverseGeocode CATCH → Hata:', err);
    return 'Bilinmeyen konum';
  }
}

function normalize(str?: string): string | undefined {
  if (!str) return undefined;
  const s = str.trim();
  if (!s) return undefined;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getUTCLabel(): string {
  const offset = -new Date().getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '-';
  return `UTC${sign}${offset}`;
}
