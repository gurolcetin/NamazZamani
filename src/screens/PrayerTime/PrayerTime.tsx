// App.tsx
import React, {useEffect, useState} from 'react';
import {SafeAreaView, View, Text, Button, ActivityIndicator, StyleSheet, Alert} from 'react-native';
import { PrayerTimings, fetchPrayerTimesByCoords } from './api';
import { requestLocationPermission, getCurrentPosition } from './permission';

export default function PrayerTimeStack() {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const ok = await requestLocationPermission();
      if (!ok) {
        Alert.alert('İzin Gerekli', 'Konum izni olmadan vakitleri hesaplayamıyoruz.');
        return;
      }
      const {latitude, longitude} = await getCurrentPosition();
      console.log(latitude, longitude);
      const data = await fetchPrayerTimesByCoords(latitude, longitude);
      setTimings(data);
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bugünkü Namaz Vakitleri</Text>
        <Button title="Yenile" onPress={load} />
      </View>

      {loading && <ActivityIndicator size="large" />}

      {!loading && timings && (
        <View style={styles.card}>
          <Row label="İmsak (Fajr)" value={timings.Fajr} />
          <Row label="Güneş" value={timings.Sunrise} />
          <Row label="Öğle (Dhuhr)" value={timings.Dhuhr} />
          <Row label="İkindi (Asr)" value={timings.Asr} />
          <Row label="Akşam (Maghrib)" value={timings.Maghrib} />
          <Row label="Yatsı (Isha)" value={timings.Isha} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Row({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  title: {fontSize: 18, fontWeight: '700'},
  card: {borderWidth: 1, borderRadius: 12, padding: 16},
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8},
  label: {fontSize: 16},
  value: {fontSize: 16, fontWeight: '600'},
});
