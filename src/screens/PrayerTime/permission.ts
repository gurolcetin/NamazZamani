// src/location.ts
import Geolocation from 'react-native-geolocation-service';
import {Platform} from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

export type LocationPermissionResult = 'granted' | 'denied' | 'blocked';

const getPermissionType = () =>
  Platform.OS === 'ios'
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

const isGranted = (status: string) =>
  status === RESULTS.GRANTED || status === RESULTS.LIMITED;

export async function hasLocationPermission(): Promise<boolean> {
  const status = await check(getPermissionType());
  return isGranted(status);
}

export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  const perm = getPermissionType();

  const status = await check(perm);
  if (status === RESULTS.BLOCKED) {
    return 'blocked';
  }
  if (isGranted(status)) {
    return 'granted';
  }

  const next = await request(perm);
  if (isGranted(next)) {
    return 'granted';
  }
  if (next === RESULTS.BLOCKED) {
    return 'blocked';
  }
  return 'denied';
}

export function getCurrentPosition(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      err => reject(err),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        // Avoid repeatedly prompting Android location accuracy dialog.
        // When location services are disabled/inaccurate, fail silently and let UI handle it.
        forceRequestLocation: false,
        showLocationDialog: false,
      },
    );
  });
}
