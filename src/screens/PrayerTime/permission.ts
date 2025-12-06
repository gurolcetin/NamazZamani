// src/location.ts
import Geolocation from 'react-native-geolocation-service';
import {Platform} from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

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

export async function requestLocationPermission(): Promise<boolean> {
  const perm = getPermissionType();

  const status = await check(perm);
  if (isGranted(status)) return true;

  const next = await request(perm);
  if (isGranted(next)) return true;

  if (next === RESULTS.BLOCKED) {
    // kullanıcı kalıcı reddettiyse ayarlara yönlendirebilirsin
    // await openSettings();
  }
  return false;
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
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );
  });
}
