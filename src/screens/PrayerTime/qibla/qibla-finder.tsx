// QiblaScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText, Path } from 'react-native-svg';
import Geolocation, {
  GeoPosition,
  GeoWatchOptions,
} from 'react-native-geolocation-service';
import CompassHeading from 'react-native-compass-heading';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Icon, Icons } from '../../../../libs/components';

/** --- Constants --- */
const KAABA = { lat: 21.422487, lon: 39.826206 }; // Mescid-i Haram
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/** --- Math helpers --- */
const toRad = (v: number) => v * D2R;
const toDeg = (v: number) => v * R2D;
const norm = (deg: number) => ((deg % 360) + 360) % 360;

// iki açı arasında en kısa fark (-180..+180)
const shortestDelta = (from: number, to: number) => {
  const a = norm(from);
  const b = norm(to);
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};

// Üstel yumuşatma (EMA) — alpha küçükse daha pürüzsüz
const smoothStep = (prev: number, next: number, alpha = 0.12) =>
  norm(prev + shortestDelta(prev, next) * alpha);

// Haversine distance (km)
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1); // ✅ lon farkı
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Initial bearing A->B (0..360)
function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const λ1 = toRad(lon1);
  const λ2 = toRad(lon2);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function turnHint(delta: number) {
  const d = norm(delta);
  if (d < 3 || d > 357) return 'Doğru Yöndesiniz';
  return d <= 180 ? 'Sağa Dön' : 'Sola Dön';
}

/** --- Component --- */
export default function QiblaScreen() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  const [rawHeading, setRawHeading] = useState(0);
  const [heading, setHeading] = useState(0);
  const smoothRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const geoWatchId = useRef<number | null>(null);

  /** Permissions + sensors start */
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'ios') {
          const res = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
          if (res !== RESULTS.GRANTED) throw new Error('Konum izni verilmedi.');
        } else {
          const res = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (res !== PermissionsAndroid.RESULTS.GRANTED)
            throw new Error('Konum izni verilmedi.');
        }

        Geolocation.getCurrentPosition(
          p => {
            setCoords({ lat: p.coords.latitude, lon: p.coords.longitude });
          },
          e => setError(e.message),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
        );

        const opts: GeoWatchOptions = {
          enableHighAccuracy: true,
          distanceFilter: 50,
          interval: 8000,
          fastestInterval: 4000,
        };
        geoWatchId.current = Geolocation.watchPosition(
          (p: GeoPosition) => {
            setCoords({ lat: p.coords.latitude, lon: p.coords.longitude });
          },
          e => setError(e.message),
          opts,
        );

        CompassHeading.start(2, ({ heading }: { heading: number }) => {
          setRawHeading(norm(heading));
        });
      } catch (e: any) {
        setError(e?.message ?? 'Bilinmeyen hata');
      }
    })();

    return () => {
      CompassHeading.stop();
      if (geoWatchId.current !== null) {
        Geolocation.clearWatch(geoWatchId.current);
        geoWatchId.current = null;
      }
    };
  }, []);

  /** Smoothing loop (yaklaşık 60 FPS) */
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const smoothed = smoothStep(smoothRef.current, rawHeading, 0.12);
      smoothRef.current = smoothed;
      setHeading(smoothed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rawHeading]);

  /** Qibla values */
  const qibla = useMemo(() => {
    if (!coords) return null;
    const b = bearingDeg(coords.lat, coords.lon, KAABA.lat, KAABA.lon);
    const d = distanceKm(coords.lat, coords.lon, KAABA.lat, KAABA.lon);
    const relative = norm(b - heading); // iğnenin ekrana göre açısı
    return { bearing: b, distanceKm: d, relative };
  }, [coords, heading]);

  /** UI sizes */
  const size = 380;
  const rOuter = size * 0.46;
  const cx = size / 2;
  const cy = size / 2;

  const directionText = qibla ? turnHint(qibla.relative) : 'Yükleniyor…';
  const isCorrect = directionText === 'Doğru Yöndesiniz';

  return (
    <View style={styles.root}>
      <View style={styles.screenInner}>
        {/* Başlık + sabit Kâbe + pusula */}
        <View style={styles.compassContainer}>
          {/* SABİT KÂBE İKONU (başlık ile pusula arası) */}
          <Icon
            type={Icons.FontAwesome6}
            name="kaaba"
            solid
            size={30}
            color={'black'}
          />

          <View style={styles.compassWrapper}>
            <Svg width={size} height={size}>
              {/* dış halka */}
              <Circle
                cx={cx}
                cy={cy}
                r={rOuter + 8}
                stroke="#22c1c3"
                strokeWidth={3}
                fill="transparent"
              />

              {/* iç daire */}
              <Circle
                cx={cx}
                cy={cy}
                r={rOuter}
                stroke="#e2e8f0"
                strokeWidth={2}
                fill="#ffffff"
              />

              {/* dönen kadran */}
              <G rotation={-heading} originX={cx} originY={cy}>
                {/* Tick çizgileri */}
                {Array.from({ length: 360 }).map((_, i) => {
                  const isMajor = i % 30 === 0;
                  const isMedium = i % 10 === 0;
                  const len = isMajor ? 16 : isMedium ? 10 : 6;
                  const a = i * D2R;
                  const x1 = cx + (rOuter - len) * Math.sin(a);
                  const y1 = cy - (rOuter - len) * Math.cos(a);
                  const x2 = cx + rOuter * Math.sin(a);
                  const y2 = cy - rOuter * Math.cos(a);
                  return (
                    <Line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isMajor ? '#cbd5e1' : '#e2e8f0'}
                      strokeWidth={isMajor ? 2 : 1}
                    />
                  );
                })}

                {/* N/E/S/W */}
                {[
                  { label: 'N', deg: 0, color: '#ef4444' },
                  { label: 'E', deg: 90, color: '#64748b' },
                  { label: 'S', deg: 180, color: '#64748b' },
                  { label: 'W', deg: 270, color: '#64748b' },
                ].map(({ label, deg, color }) => {
                  const a = deg * D2R;
                  const rx = cx + (rOuter - 36) * Math.sin(a);
                  const ry = cy - (rOuter - 36) * Math.cos(a);
                  return (
                    <SvgText
                      key={label}
                      x={rx}
                      y={ry + 8}
                      fontSize={18}
                      fontWeight="700"
                      textAnchor="middle"
                      fill={color}
                    >
                      {label}
                    </SvgText>
                  );
                })}

                {/* Derece yazıları (W, N, S, E HARİÇ her 30°) */}
                {Array.from({ length: 12 }).map((_, idx) => {
                  const angle = idx * 30; // 0,30,60,...,330
                  if ([0, 90, 180, 270].includes(angle)) return null; // NESW hariç

                  const rad = angle * D2R;
                  const rx = cx + (rOuter - 24) * Math.sin(rad);
                  const ry = cy - (rOuter - 24) * Math.cos(rad);

                  return (
                    <SvgText
                      key={`deg-${angle}`}
                      x={rx}
                      y={ry + 4}
                      fontSize={10}
                      textAnchor="middle"
                      fill="#94a3b8"
                    >
                      {angle}
                    </SvgText>
                  );
                })}
              </G>

              {/* kıble iğnesi – sadece OK (Kâbe artık sabit yukarıda) */}
              {qibla && (
                <G originX={cx} originY={cy} rotation={qibla.relative}>
                  <Path
                    d={`M ${cx} ${cy - rOuter}
                       L ${cx - 10} ${cy - rOuter + 20}
                       L ${cx + 10} ${cy - rOuter + 20} Z`}
                    fill="#10b981"
                  />
                </G>
              )}

              {/* merkez daire + ok */}
              <Circle
                cx={cx}
                cy={cy}
                r={32}
                fill="#ffffff"
                stroke="#22c1c3"
                strokeWidth={2}
              />
              <Path
                d={`M ${cx} ${cy - 16} L ${cx + 12} ${cy + 8} L ${cx} ${
                  cy + 4
                } Z`}
                fill="#14b8a6"
              />
              <Circle cx={cx} cy={cy} r={4} fill="#ffffff" />
            </Svg>
          </View>
        </View>

        {/* Alt kart: Bilgi paneli */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoLabel}>Yön</Text>
            <Text
              style={[
                styles.infoDirection,
                isCorrect ? styles.infoDirectionOk : styles.infoDirectionWarn,
              ]}
            >
              {directionText}
            </Text>
          </View>

          <View style={styles.degreeBox}>
            <Text style={styles.bigDegree}>{Math.round(heading)}°</Text>
          </View>

          {qibla && (
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Kıble Açısı</Text>
                <Text style={styles.metaValue}>
                  {Math.round(qibla.bearing)}°
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Uzaklık</Text>
                <Text style={styles.metaValue}>
                  {qibla.distanceKm.toFixed(1)} km
                </Text>
              </View>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={{ height: 12 }} />
      </View>
    </View>
  );
}

/** --- Styles --- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenInner: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  compassContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  compassWrapper: {
    marginTop: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },

  // Başlık ile pusula arasındaki sabit Kâbe ikonu
  kaabaStaticWrapper: {
    marginTop: 6,
    marginBottom: 6,
  },

  infoCard: {
    borderRadius: 22,
    backgroundColor: '#ffffff',
    paddingHorizontal: 80,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
    marginHorizontal: 20,
  },
  infoHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  infoDirection: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoDirectionOk: {
    color: '#059669',
  },
  infoDirectionWarn: {
    color: '#d97706',
  },

  degreeBox: {
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#eef4ff',
    alignItems: 'center',
  },

  bigDegree: {
    fontSize: 52,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 1,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 14,
    color: '#0f172a',
  },

  error: {
    marginTop: 10,
    textAlign: 'center',
    color: '#ef4444',
  },
});
