export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type LocationPermission = PermissionState | "unsupported";

const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12_000,
  maximumAge: 5_000,
};

export function isGeolocationSupported(): boolean {
  return "geolocation" in navigator;
}

export async function queryLocationPermission(): Promise<LocationPermission> {
  if (!("permissions" in navigator)) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unsupported";
  }
}

export function watchUserLocation(
  onLocation: (location: UserLocation) => void,
  onError: (error: GeolocationPositionError) => void,
): () => void {
  if (!isGeolocationSupported()) {
    onError({
      code: 2,
      message: "Geolocation is not supported in this browser.",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });
    return () => undefined;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    onError,
    LOCATION_OPTIONS,
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
