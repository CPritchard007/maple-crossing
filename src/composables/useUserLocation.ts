import { onUnmounted, ref } from "vue";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import {
  isGeolocationSupported,
  queryLocationPermission,
  watchUserLocation,
  type UserLocation,
} from "../location";

export function useUserLocation() {
  const toast = useToast();
  const confirm = useConfirm();
  const location = ref<UserLocation | null>(null);
  let stopWatching: (() => void) | undefined;
  let hasAnnouncedLocation = false;

  function showDeniedNotice(): void {
    toast.add({
      severity: "error",
      summary: "Location access is blocked",
      detail: "Enable location for this site in your browser settings, then reload the page.",
      life: 6000,
    });
  }

  function showErrorNotice(error: GeolocationPositionError): void {
    if (error.code === error.PERMISSION_DENIED) {
      showDeniedNotice();
      return;
    }

    toast.add({
      severity: "warn",
      summary: "Could not find you",
      detail:
        error.code === error.TIMEOUT
          ? "It is taking too long to find your location. Check that location services are on, then try again."
          : "Your location could not be determined. Move to an open area or try again.",
      life: 6000,
    });
  }

  function startLocationWatch(): void {
    toast.removeAllGroups();
    stopWatching?.();
    hasAnnouncedLocation = false;

    stopWatching = watchUserLocation((next) => {
      location.value = next;

      if (hasAnnouncedLocation) {
        return;
      }

      hasAnnouncedLocation = true;
      toast.add({
        severity: "success",
        summary: "Location found",
        detail: "Showing your current position on the map.",
        life: 2800,
      });
    }, showErrorNotice);
  }

  function requestLocationAccess(): void {
    toast.add({
      severity: "info",
      summary: "Finding your location",
      detail: "Allow location access in the browser prompt so the map can place you.",
      life: 4000,
    });
    startLocationWatch();
  }

  function promptForLocation(): void {
    confirm.require({
      header: "Share your location",
      message: "Maple Crossing needs location access to show where you are on the map.",
      icon: "pi pi-map-marker",
      rejectProps: {
        label: "Not now",
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: "Allow location",
      },
      accept: requestLocationAccess,
    });
  }

  async function initLocation(): Promise<void> {
    if (!isGeolocationSupported()) {
      toast.add({
        severity: "error",
        summary: "Location is unavailable",
        detail: "This browser does not support location access, so the map cannot show where you are.",
        life: 6000,
      });
      return;
    }

    const permission = await queryLocationPermission();

    if (permission === "granted") {
      startLocationWatch();
      return;
    }

    if (permission === "denied") {
      showDeniedNotice();
      return;
    }

    promptForLocation();
  }

  onUnmounted(() => stopWatching?.());

  return {
    location,
    initLocation,
    requestLocationAccess,
  };
}
