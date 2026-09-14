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
const { crossings, direction, lastUpdated, error, loading, toggleDirection } = useBorderWaitTimes(location);
const view = ref<AppView>("map");
const selectedCrossingId = ref<string | null>(null);
const followingUser = ref(false);

function selectView(next: AppView): void {
  view.value = next;
  if (next === "border") {
    followingUser.value = false;
  }
}

function selectCrossing(id: string): void {
  followingUser.value = false;
  selectedCrossingId.value = id;
  view.value = "border";
}

function followUser(): void {
  if (followingUser.value) {
    followingUser.value = false;
    return;
  }

  followingUser.value = true;
  view.value = "map";
  if (!location.value) {
    requestLocationAccess();
  }
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
        :follow-user="followingUser"
        :selected-crossing-id="selectedCrossingId"
        :crossings="crossings"
        @traffic-available="onTrafficAvailable"
        @select-crossing="selectCrossing"
      />
      <button
        type="button"
        class="follow-link"
        :class="{ 'is-active': followingUser }"
        :aria-pressed="followingUser"
        :aria-label="followingUser ? 'Following you' : 'Follow me'"
        :title="followingUser ? 'Following you' : 'Follow me'"
        @click="followUser"
      >
        <svg class="follow-link__icon" viewBox="0 0 24 24" aria-hidden="true">
          <template v-if="followingUser">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </template>
          <template v-else>
            <path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-7.07-7.07L11.75 5.18" />
            <path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 7.07 7.07l1.71-1.71" />
            <path d="M8 2v3M2 8h3M16 19v3M19 16h3" />
          </template>
        </svg>
      </button>
      <CrossingWaitChart
        :crossings="crossings"
        :direction="direction"
        :selected-id="selectedCrossingId"
        :last-updated="lastUpdated"
        :error="error"
        :loading="loading"
        @select="selectCrossing"
        @toggle-direction="toggleDirection"
      />
    </main>
    <Toast position="top-center" />
    <ConfirmDialog />
  </div>
</template>
