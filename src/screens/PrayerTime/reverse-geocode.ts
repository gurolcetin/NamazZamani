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

// reverseGeocode.ts
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
  const country = (a.country_code || '').toUpperCase();

  // 1) "şehir" benzeri etiket (daha dar ölçekli olanları öncele)
  // TR’de ilçe/il ayrımı için city_district / district / county’yi de değerlendiriyoruz
  const cityLike =
    a.city_district ||
    a.district ||
    a.town ||
    a.county || // (ilçe olarak gelebilir)
    a.suburb ||
    a.village ||
    a.city || // (bazen İstanbul)
    a.municipality ||
    a.locality ||
    a.hamlet;

  // 2) "üst idari" etiket (state/province > county > region)
  // region (örn. Marmara Bölgesi) yalnızca daha iyi seçenek yoksa
  const adminCandidates = [
    a.state,
    a.province,
    a.state_district,
    a.county,
    undefined, // boşluk, region’ı şimdilik atlıyoruz
    // a.region        // en sona saklıyoruz
  ] as (string | undefined)[];

  let adminLike = adminCandidates.find(Boolean);

  // 3) TR için "… Bölgesi" (region) isimlerini kullanma
  // Eğer elimizde state/province yoksa ve adminLike yoksa, son çare region’a bak
  if (!adminLike) {
    const region = a.region;
    if (country === 'TR') {
      // TR’de "Marmara Bölgesi" vb. çok geniş; state varsa onu tercih edelim
      // (buraya gelmişsek state/province zaten yok demektir)
      // TR’de region’ı tamamen atla
      adminLike = undefined;
    } else {
      adminLike = region; // TR dışı ülkelerde region’a izin ver
    }
  }

  // 4) Aynı isim tekrarı varsa admin’i düşür
  let city = normalize(cityLike);
  let admin = normalize(adminLike);
  if (city && admin && city.toLowerCase() === admin.toLowerCase()) {
    admin = undefined;
  }

  // 5) TR özel: eğer admin boş ve state=İstanbul gibi bir değer varsa onu kullan
  if (country === 'TR') {
    const state = normalize(a.state);
    const province = normalize(a.province);
    // Region’ı zaten kullanmıyoruz; county/district bir şehir adını veriyorsa admin olarak "İstanbul" gibi state tercih edilir
    if (!admin && (state || province)) {
      admin = state || province;
    }
    // admin "… Bölgesi" ise yine düşür
    if (admin && /Bölgesi$/i.test(admin)) admin = undefined;
  }

  const parts = [city, admin].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Bilinmeyen konum';
}

function normalize(str?: string): string | undefined {
  if (!str) return undefined;
  const s = String(str).trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getUTCLabel(): string {
  const offset = -new Date().getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '';
  return `UTC${sign}${offset}`;
}
