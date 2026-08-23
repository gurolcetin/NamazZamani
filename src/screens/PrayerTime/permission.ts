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

/**
 * Thrown when the device's location services (GPS) are disabled at the system level,
 * even though the app has been granted location permission.
 * Error codes: 2 (POSITION_UNAVAILABLE) and 5 (SETTINGS_NOT_SATISFIED) on Android.
 */
export class LocationServicesDisabledError extends Error {
  constructor() {
    super('LOCATION_SERVICES_DISABLED');
    this.name = 'LocationServicesDisabledError';
  }
}

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
      err => {
        // Codes 2 (POSITION_UNAVAILABLE) and 5 (SETTINGS_NOT_SATISFIED) mean
        // the device's location services (GPS toggle) are off at the system level.
        if (err.code === 2 || err.code === 5) {
          reject(new LocationServicesDisabledError());
        } else {
          reject(err);
        }
      },
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
