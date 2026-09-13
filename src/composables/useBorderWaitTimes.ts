import { onMounted, onUnmounted, ref } from "vue";
import { fetchBorderFeed, type CrossingWait } from "../border";

const REFRESH_MS = 60_000;

export function useBorderWaitTimes() {
  const crossings = ref<CrossingWait[]>([]);
  const lastUpdated = ref("");
  const error = ref("");
  const loading = ref(false);
  let timer = 0;

  async function refresh(): Promise<void> {
    loading.value = crossings.value.length === 0;
    try {
      const feed = await fetchBorderFeed();
      crossings.value = feed.crossings;
      lastUpdated.value = feed.lastUpdated;
      error.value = "";
    } catch {
      error.value = "Could not refresh CBP border wait times.";
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
    lastUpdated,
    error,
    loading,
    refresh,
  };
}
