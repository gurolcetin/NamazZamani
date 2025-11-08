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
  const dLon = toRad(lon2 - lon1);
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
  if (d < 5 || d > 355) return 'Doğru Yöndesiniz';
  return d <= 180 ? 'Sağa Dön' : 'Sola Dön';
}

/** --- Component --- */
export default function QiblaScreen() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );

  // ham başlık (sensör), yumuşatılmış başlık (ekranda görünen)
  const [rawHeading, setRawHeading] = useState(0);
  const [heading, setHeading] = useState(0);
  const smoothRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const geoWatchId = useRef<number | null>(null);

  /** Permissions + sensors start */
  useEffect(() => {
    (async () => {
      try {
        // Location permission
        if (Platform.OS === 'ios') {
          const res = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
          if (res !== RESULTS.GRANTED) throw new Error('Konum izni verilmedi.');
        } else {
          const res = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (res !== PermissionsAndroid.RESULTS.GRANTED)
            throw new Error('Konum izni verilmedi.');
        }

        // Initial position
        Geolocation.getCurrentPosition(
          (p) => {
            setCoords({ lat: p.coords.latitude, lon: p.coords.longitude });
          },
          (e) => setError(e.message),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );

        // Watch position (50m ve üstünde güncelle)
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
          (e) => setError(e.message),
          opts
        );

        // Compass — küçük filtre; yumuşatmayı biz yapacağız
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
  const size = 320;
  const rOuter = size * 0.46;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pusula</Text>

      <Svg width={size} height={size} style={{ marginTop: 8 }}>
        {/* dış daire */}
        <Circle cx={cx} cy={cy} r={rOuter} stroke="#e9eaed" strokeWidth={2} fill="#fff" />

        {/* dönen kadran (yumuşatılmış başlık ile) */}
        <G rotation={-heading} originX={cx} originY={cy}>
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
                stroke={isMajor ? '#cfd3d8' : '#e1e4e8'}
                strokeWidth={isMajor ? 2 : 1}
              />
            );
          })}
          {/* N/E/S/W */}
          {[
            { label: 'N', deg: 0 },
            { label: 'E', deg: 90 },
            { label: 'S', deg: 180 },
            { label: 'W', deg: 270 },
          ].map(({ label, deg }) => {
            const a = deg * D2R;
            const rx = cx + (rOuter - 36) * Math.sin(a);
            const ry = cy - (rOuter - 36) * Math.cos(a);
            return (
              <SvgText
                key={label}
                x={rx}
                y={ry + 8}
                fontSize={22}
                fontWeight="700"
                textAnchor="middle"
                fill="#000"
              >
                {label}
              </SvgText>
            );
          })}
        </G>

        {/* kıble iğnesi (başlığa göre rölatif) */}
        {qibla && (
          <G originX={cx} originY={cy} rotation={qibla.relative}>
            {/* kırmızı ok */}
            <Path d={`M ${cx} ${cy - (rOuter - 6)} l 16 6 l -16 6 z`} fill="#ff4d4f" />
            {/* Kâbe simgesi */}
            <G x={cx + (rOuter - 46)} y={cy - 16}>
              <Path d="M0 8 L12 0 L24 8 L12 16 Z" fill="#2d2d2d" />
              <Path d="M0 8 L0 20 L12 28 L12 16 Z" fill="#575757" />
              <Path d="M24 8 L24 20 L12 28 L12 16 Z" fill="#3f3f3f" />
              <Path d="M0 11 L24 11" stroke="#bca15a" strokeWidth={2} />
            </G>
          </G>
        )}

        {/* merkez buton/ok görseli */}
        <Circle cx={cx} cy={cy} r={34} fill="#fff" stroke="#3ddbd9" strokeWidth={2} />
        <SvgText x={cx} y={cy + 6} fontSize={28} textAnchor="middle" fill="#23a3a1">
          →
        </SvgText>
      </Svg>

      <Text style={styles.hint}>
        {qibla ? turnHint(qibla.relative) : 'Yükleniyor…'}
      </Text>

      <Text style={styles.bigDegree}>{Math.round(heading)}°</Text>

      {qibla && (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={styles.meta}>Kıble Açısı : {Math.round(qibla.bearing)}°</Text>
          <Text style={styles.meta}>Uzaklık : {qibla.distanceKm.toFixed(1)} km</Text>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/** --- Styles --- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  hint: {
    marginTop: 6,
    fontSize: 16,
    color: '#333',
  },
  bigDegree: {
    marginTop: 16,
    fontSize: 96,
    fontWeight: '600',
    letterSpacing: 2,
  },
  meta: {
    fontSize: 16,
    color: '#333',
  },
  error: {
    marginTop: 16,
    color: '#ff4d4f',
  },
});
