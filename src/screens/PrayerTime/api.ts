// src/prayerApi.ts
export type PrayerTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
};

function getDeviceTimeZone(): string {
  // JS ile güvenli timezone alma
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'
    );
  } catch {
    return 'Europe/Istanbul';
  }
}

export async function fetchPrayerTimesByCoords(
  latitude: number,
  longitude: number,
): Promise<PrayerTimings> {
    console.log(getDeviceTimeZone());
  const tz = encodeURIComponent(getDeviceTimeZone());
  const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=13&timezonestring=${tz}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json?.code !== 200) {
    throw new Error(json?.data || 'API hatası');
  }
  console.log(json.data.timings);
  return json.data.timings as PrayerTimings;
}
