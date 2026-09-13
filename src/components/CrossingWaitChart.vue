<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { crossingChartRows, formatRelativeUpdated, type CrossingWait } from "../border";

const props = defineProps<{
  crossings: CrossingWait[];
  selectedId: string | null;
  lastUpdated: string;
  error: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

const now = ref(Date.now());
let timer = 0;

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now();
  }, 30_000);
});

onUnmounted(() => {
  window.clearInterval(timer);
});

const rows = computed(() => crossingChartRows(props.crossings));
const slowest = computed(() => rows.value.find((row) => row.slowest));
const updatedLabel = computed(() => formatRelativeUpdated(props.lastUpdated, now.value));
</script>

<template>
  <aside class="crossing-chart" aria-label="Windsor–Detroit wait times">
    <p v-if="error" class="crossing-chart__error">{{ error }}</p>
    <p v-else-if="slowest" class="crossing-chart__lead">
      Slowest now: <strong>{{ slowest.name }}</strong>
    </p>
    <p v-else class="crossing-chart__lead">
      {{ loading ? "Loading wait times…" : "Into the U.S." }}
    </p>
    <ol class="crossing-chart__list">
      <li v-for="row in rows" :key="row.id">
        <button
          type="button"
          class="crossing-chart__row"
          :class="{ 'is-slowest': row.slowest, 'is-selected': row.id === selectedId }"
          :aria-label="`Show ${row.name}, ${row.label}`"
          @click="emit('select', row.id)"
        >
          <span class="crossing-chart__name">{{ row.name }}</span>
          <span class="crossing-chart__track" aria-hidden="true">
            <span class="crossing-chart__bar" :style="{ width: `${row.percent}%` }"></span>
          </span>
          <span class="crossing-chart__wait">{{ row.label }}</span>
        </button>
      </li>
    </ol>
    <p v-if="updatedLabel && !error" class="crossing-chart__meta">Updated {{ updatedLabel }}</p>
  </aside>
</template>
