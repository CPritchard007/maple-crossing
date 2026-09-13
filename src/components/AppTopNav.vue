<script setup lang="ts">
import Button from "primevue/button";
import Menubar from "primevue/menubar";
import { computed } from "vue";
import type { MenuItem } from "primevue/menuitem";
import type { AppView } from "../border";
import type { Theme } from "../composables/useTheme";

const props = defineProps<{
  theme: Theme;
  view: AppView;
}>();

const emit = defineEmits<{
  locate: [];
  toggleTheme: [];
  selectView: [view: AppView];
}>();

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
      <Button
        :icon="props.theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
        :aria-label="props.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        severity="secondary"
        rounded
        text
        @click="emit('toggleTheme')"
      />
    </template>
  </Menubar>
</template>
