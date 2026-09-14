import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import {
  crossingsFromFeed,
  fetchBarometerFeed,
  travelDirectionFromLocation,
  type BarometerFeed,
  type CrossingWait,
  type TravelDirection,
} from "../border";
import type { UserLocation } from "../location";

const REFRESH_MS = 60_000;

export function useBorderWaitTimes(location: Ref<UserLocation | null>) {
  const feed = ref<BarometerFeed | null>(null);
  const override = ref<TravelDirection | null>(null);
  const lastUpdated = ref("");
  const error = ref("");
  const loading = ref(false);
  let timer = 0;

  const direction = computed(
    () => override.value ?? travelDirectionFromLocation(location.value),
  );

  function toggleDirection(): void {
    override.value = direction.value === "into_us" ? "into_canada" : "into_us";
  }

  const crossings = computed<CrossingWait[]>(() => {
    if (!feed.value) {
      return [];
    }

    return crossingsFromFeed(feed.value, direction.value);
  });

  async function refresh(): Promise<void> {
    loading.value = feed.value == null;
    try {
      const next = await fetchBarometerFeed();
      feed.value = next;
      lastUpdated.value = next.generated_at_utc || next.generated_at || "";
      error.value = "";
    } catch {
      error.value = "Could not refresh Transit Barometer wait times.";
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void refresh();
    timer = window.setInterval(() => {
      void refresh();
    }, REFRESH_MS);
  });

  onUnmounted(() => {
    window.clearInterval(timer);
  });

  return {
    crossings,
    direction,
    lastUpdated,
    error,
    loading,
    refresh,
    toggleDirection,
  };
}
