import tzlookup from '@photostructure/tz-lookup';

export function getTimeZoneByCoords(lat: number, lon: number): string {
  try {
    console.log(tzlookup(lat, lon));
    return tzlookup(lat, lon);
  } catch (e) {
    console.warn('TZ lookup failed', e);
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }
}

export function getUtcLabelFromTimeZone(
  timeZone: string,
  at: Date = new Date(),
): string {
  console.log('🕐 [getUtcLabelFromTimeZone] GİRİŞ:', {
    timeZone,
    at: at.toISOString?.() ?? at,
  });

  try {
    // --- 1️⃣ Boş veya geçersiz timezone guard ---
    if (!timeZone) {
      return deviceOffsetLabel();
    }

    // --- 2️⃣ "Etc/GMT±x" formatı kontrolü ---
    if (/^Etc\/GMT([+-]\d+)$/.test(timeZone)) {
      const m = timeZone.match(/^Etc\/GMT([+-]\d+)$/)!;
      const offset = -parseInt(m[1], 10); // işaret ters
      const sign = offset >= 0 ? '+' : '';
      const label = `UTC${sign}${offset}`;
      return label;
    }

    // --- 3️⃣ Intl ile timezone’a göre tarih parçalarını al ---
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parts = dtf.formatToParts(at);

    const get = (t: string) =>
      parseInt(parts.find(p => p.type === t)?.value || '0', 10);
    const y = get('year');
    const M = get('month');
    const d = get('day');
    let h = get('hour');
    const m = get('minute');
    const s = get('second');

    // --- 4️⃣ Bazı cihazlarda saat 24 olabiliyor ---
    if (h >= 24) {
      h = 0;
    }

    const tzMs = Date.UTC(y, M - 1, d, h, m, s);

    if (!isFinite(tzMs)) {
      throw new Error('Invalid date parts');
    }

    const offsetMin = Math.round((tzMs - at.getTime()) / 60000);

    if (!isFinite(offsetMin)) {
      return deviceOffsetLabel();
    }

    const sign = offsetMin >= 0 ? '+' : '';
    const hours = offsetMin / 60;
    const label = `UTC${sign}${Number(hours.toFixed(2))
      .toString()
      .replace(/\.0+$/, '')}`;

    return label;
  } catch (err) {
    console.warn('Exception:', err);
    return deviceOffsetLabel();
  }
}

function deviceOffsetLabel(): string {
  const offset = -new Date().getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '';
  const label = `UTC${sign}${Number(offset.toFixed(2))
    .toString()
    .replace(/\.0+$/, '')}`;
  return label;
}
