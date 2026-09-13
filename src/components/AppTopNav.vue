<script setup lang="ts">
import Button from "primevue/button";
import Chip from "primevue/chip";
import Menubar from "primevue/menubar";
import { computed } from "vue";
import type { MenuItem } from "primevue/menuitem";
import type { AppView } from "../border";
import type { Theme } from "../composables/useTheme";
import { useUsdCadRate } from "../composables/useUsdCadRate";

const props = defineProps<{
  theme: Theme;
  view: AppView;
}>();

const emit = defineEmits<{
  locate: [];
  toggleTheme: [];
  selectView: [view: AppView];
}>();

const { quote, label, detail } = useUsdCadRate();

const items = computed<MenuItem[]>(() => [
  {
    label: "Map",
    icon: "pi pi-map",
    class: props.view === "map" ? "is-active" : undefined,
    command: () => emit("selectView", "map"),
  },
  {
    label: "Border",
    icon: "pi pi-globe",
    class: props.view === "border" ? "is-active" : undefined,
    command: () => emit("selectView", "border"),
  },
  {
    label: "Share location",
    icon: "pi pi-map-marker",
    command: () => emit("locate"),
  },
]);
</script>

<template>
  <Menubar :model="items" breakpoint="640px" class="app-topnav" aria-label="Maple Crossing">
    <template #start>
      <span class="app-topnav__brand">Maple Crossing</span>
    </template>
    <template #end>
      <div class="app-topnav__actions">
        <span v-if="quote" class="fx-chip-wrap" :title="detail">
          <Chip
            class="fx-chip"
            :class="quote.sentiment === 'good' ? 'is-good' : 'is-bad'"
            :label="detail"
          >
            <span class="fx-chip__pair">US$1 →</span>
            <span class="fx-chip__value">{{ label }}</span>
          </Chip>
        </span>
        <Button
          :icon="props.theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
          :aria-label="props.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          severity="secondary"
          rounded
          text
          @click="emit('toggleTheme')"
        />
      </div>
    </template>
  </Menubar>
</template>
