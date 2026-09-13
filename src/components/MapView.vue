<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { createMap, type CrossingMarkerData, type MapController } from "../map";
import type { UserLocation } from "../location";
import type { Theme } from "../composables/useTheme";
import type { AppView, CrossingWait } from "../border";
import { CROSSINGS, shortWait } from "../border";
import type { TrafficAvailability } from "../traffic";

const props = defineProps<{
  location: UserLocation | null;
  theme: Theme;
  view: AppView;
  selectedCrossingId: string | null;
  crossings: CrossingWait[];
}>();

const emit = defineEmits<{
  trafficAvailable: [available: TrafficAvailability];
  selectCrossing: [id: string];
}>();

const mapEl = ref<HTMLElement | null>(null);
let map: MapController | null = null;
let resizeObserver: ResizeObserver | undefined;

function markerData(): CrossingMarkerData[] {
  return CROSSINGS.map((definition) => {
    const wait = props.crossings.find((item) => item.id === definition.id);
    return {
      id: definition.id,
      name: definition.name,
      waitLabel: shortWait(wait?.passengerStandard),
    };
  });
}

function syncCrossingMarkers(): void {
  if (props.view !== "border") {
    map?.clearCrossingMarkers();
    return;
  }

  map?.setCrossingMarkers(markerData(), props.selectedCrossingId, (id) => emit("selectCrossing", id));
}

function applyView(): void {
  if (!map) {
    return;
  }

  if (props.view === "border") {
    map.setFollowUser(false);
    syncCrossingMarkers();
    if (props.selectedCrossingId) {
      map.focusCrossing(props.selectedCrossingId);
      return;
    }

    map.focusBorderOverview();
    return;
  }

  map.setFollowUser(true);
  map.clearCrossingMarkers();
  map.focusHome(props.location);
}

onMounted(async () => {
  if (!mapEl.value) {
    return;
  }

  map = createMap(mapEl.value);
  map.setIncidentTheme(props.theme === "dark");

  if (props.location) {
    map.setUserLocation(props.location, { follow: props.view === "map" });
  }

  await nextTick();
  map.invalidateSize();

  resizeObserver = new ResizeObserver(() => map?.invalidateSize());
  resizeObserver.observe(mapEl.value);

  const available = await map.enableTrafficIfAvailable(props.theme === "dark");
  emit("trafficAvailable", available);

  if (props.view === "border") {
    applyView();
  }
});

watch(
  () => props.location,
  (location) => {
    if (location) {
      map?.setUserLocation(location, { follow: props.view === "map" });
    }
  },
);

watch(
  () => [props.view, props.selectedCrossingId] as const,
  () => {
    applyView();
  },
);

watch(
  () => props.crossings,
  () => {
    syncCrossingMarkers();
  },
);

watch(
  () => props.theme,
  (theme) => {
    map?.setIncidentTheme(theme === "dark");
  },
);

onUnmounted(() => {
  resizeObserver?.disconnect();
  map?.destroy();
});
</script>

<template>
  <div ref="mapEl" class="map-view" aria-label="Map" />
</template>
