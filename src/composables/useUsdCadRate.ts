import { computed, onMounted, onUnmounted, ref } from "vue";
import { fetchUsdCadQuote, formatUsdCadRate, type UsdCadQuote } from "../fx";

const REFRESH_MS = 60 * 60 * 1000;

export function useUsdCadRate() {
  const quote = ref<UsdCadQuote | null>(null);
  const error = ref("");
  let timer = 0;

  async function refresh(): Promise<void> {
    try {
      quote.value = await fetchUsdCadQuote();
      error.value = "";
    } catch {
      if (!quote.value) {
        error.value = "Could not load the US to Canadian dollar rate.";
      }
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

  const label = computed(() => {
    if (!quote.value) {
      return "";
    }

    return `C$${formatUsdCadRate(quote.value.rate)}`;
  });

  const detail = computed(() => {
    if (!quote.value) {
      return "";
    }

    const value = formatUsdCadRate(quote.value.rate);
    const outlook =
      quote.value.sentiment === "good"
        ? "Above parity, good for Canadians"
        : "At or below parity, bad for Canadians";
    const asOf = quote.value.asOf ? ` as of ${quote.value.asOf}` : "";
    return `US$1 buys C$${value}${asOf}. ${outlook}.`;
  });

  return {
    quote,
    label,
    detail,
    error,
    refresh,
  };
}
