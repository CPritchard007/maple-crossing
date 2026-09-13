import { onMounted, onUnmounted, ref } from "vue";

export type Theme = "light" | "dark";

const STORAGE_KEY = "maple-crossing-theme";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "dark" || value === "light" ? value : null;
}

function readDocumentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useTheme() {
  const theme = ref<Theme>(readDocumentTheme());
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(next: Theme, persist = true): void {
    theme.value = next;
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#121511" : "#f4f1ea");

    if (persist) {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }

  function toggleTheme(): void {
    applyTheme(theme.value === "dark" ? "light" : "dark");
  }

  function onSystemThemeChange(event: MediaQueryListEvent): void {
    if (!readStoredTheme()) {
      applyTheme(event.matches ? "dark" : "light", false);
    }
  }

  onMounted(() => {
    applyTheme(readStoredTheme() ?? systemTheme(), false);
    media.addEventListener("change", onSystemThemeChange);
  });

  onUnmounted(() => {
    media.removeEventListener("change", onSystemThemeChange);
  });

  return { theme, toggleTheme };
}
