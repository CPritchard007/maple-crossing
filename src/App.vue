<script setup lang="ts">
import { onMounted, ref } from "vue";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";
import AppTopNav from "./components/AppTopNav.vue";
import CrossingWaitChart from "./components/CrossingWaitChart.vue";
import MapView from "./components/MapView.vue";
import type { AppView } from "./border";
import { useBorderWaitTimes } from "./composables/useBorderWaitTimes";
import { useTheme } from "./composables/useTheme";
import { useUserLocation } from "./composables/useUserLocation";
import type { TrafficAvailability } from "./traffic";

const toast = useToast();
const { theme, toggleTheme } = useTheme();
const { location, initLocation, requestLocationAccess } = useUserLocation();
const { crossings, lastUpdated, error, loading } = useBorderWaitTimes();
const view = ref<AppView>("map");
const selectedCrossingId = ref<string | null>(null);

function selectView(next: AppView): void {
  view.value = next;
}

function selectCrossing(id: string): void {
  selectedCrossingId.value = id;
  view.value = "border";
}

function onTrafficAvailable(available: TrafficAvailability): void {
  if (available.error) {
    toast.add({
      severity: "warn",
      summary: "Traffic layers unavailable",
      detail: available.error,
      life: 8000,
    });
  }
}

onMounted(() => {
  void initLocation();
});
</script>

<template>
  <div class="app-shell">
    <AppTopNav
      :theme="theme"
      :view="view"
      @locate="requestLocationAccess"
      @toggle-theme="toggleTheme"
      @select-view="selectView"
    />
    <main class="app-shell__map">
      <MapView
        :location="location"
        :theme="theme"
        :view="view"
        :selected-crossing-id="selectedCrossingId"
        :crossings="crossings"
        @traffic-available="onTrafficAvailable"
        @select-crossing="selectCrossing"
      />
      <CrossingWaitChart
        :crossings="crossings"
        :selected-id="selectedCrossingId"
        :last-updated="lastUpdated"
        :error="error"
        :loading="loading"
        @select="selectCrossing"
      />
    </main>
    <Toast position="top-center" />
    <ConfirmDialog />
  </div>
</template>
