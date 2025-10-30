export type PrayerTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
};

// Basit bellek cache’i: "YYYY-MM@lat,lon" -> gün[] (1-indexed)
const monthCache = new Map<string, PrayerTimings[]>();

function getDeviceTimeZone(): string {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'
    );
  } catch {
    return 'Europe/Istanbul';
  }
}

// Aladhan calendar: ayın tüm günleri
export async function fetchMonthlyPrayerTimesByCoords(
  year: number,
  month1to12: number,
  latitude: number,
  longitude: number,
): Promise<PrayerTimings[]> {
  const key = `${year}-${String(month1to12).padStart(
    2,
    '0',
  )}@${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = monthCache.get(key);
  if (cached) return cached;

  const tz = encodeURIComponent(getDeviceTimeZone());
  // method=13 (Diyanet) aynı kalsın; ihtiyaç olursa ayarlanabilir.
  const url = `https://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=13&month=${month1to12}&year=${year}&timezonestring=${tz}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json?.code !== 200) throw new Error(json?.data || 'API hatası');

  // Günlük kayıtlardan sadece ihtiyacımız olan 6 vaktin HH:mm kısmını çek.
  const strip = (s: string) => {
    const m = String(s).match(/(\d{2}:\d{2})/);
    return m ? m[1] : s;
  };
  const data: PrayerTimings[] = json.data.map((d: any) => {
    const t = d.timings || {};
    return {
      Fajr: strip(t.Fajr),
      Sunrise: strip(t.Sunrise),
      Dhuhr: strip(t.Dhuhr),
      Asr: strip(t.Asr),
      Maghrib: strip(t.Maghrib),
      Isha: strip(t.Isha),
    };
  });
  monthCache.set(key, data);
  return data;
}
