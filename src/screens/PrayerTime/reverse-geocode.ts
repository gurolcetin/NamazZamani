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
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=tr,en`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'PrayerTimesApp/1.0 (contact: example@example.com)',
    },
  });
  if (!res.ok) throw new Error('Ters geocode başarısız');
  const json = await res.json();
  const a = json?.address || {};

  // 1️⃣ City-level alanı belirle
  const cityLike =
    a.city_district ||
    a.district ||
    a.town ||
    a.village ||
    a.municipality ||
    a.suburb ||
    a.city ||
    a.county ||
    a.locality ||
    a.hamlet;

  // 2️⃣ Üst idari alan (state / province / region sıralı)
  let adminLike =
    a.state ||
    a.province ||
    a.state_district ||
    a.county ||
    a.region ||
    undefined;

  // 3️⃣ Çok geniş bölgeleri filtrele
  // "Region" veya "Bölgesi", "Area", "Zone" gibi kelimeler içeren adminleri at
  if (adminLike && /(region|bölgesi|area|zone)/i.test(adminLike)) {
    // eğer state/province yoksa region yerine state’i kullan, yoksa boş bırak
    adminLike = a.state || a.province || undefined;
  }

  // 4️⃣ Aynı isimse tekrar etme
  let city = normalize(cityLike);
  let admin = normalize(adminLike);
  if (city && admin && city.toLowerCase() === admin.toLowerCase()) {
    admin = undefined;
  }

  // 5️⃣ Fallback — sadece ülke ismini kullan (çok küçük yerlerde)
  if (!city && !admin && a.country) {
    city = a.country;
  }

  const parts = [city, admin].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Bilinmeyen konum';
}

function normalize(str?: string): string | undefined {
  if (!str) return undefined;
  const s = str.trim();
  // ilk harf büyük
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getUTCLabel(): string {
  const offset = -new Date().getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '';
  return `UTC${sign}${offset}`;
}