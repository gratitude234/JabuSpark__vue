<template>
  <div :class="cardClass">
    <div class="space-y-1">
      <p
        class="text-[11px] font-medium uppercase tracking-wide"
        :class="toneClasses.heading"
      >
        {{ title }}
      </p>
      <p v-if="caption" class="text-xs" :class="toneClasses.caption">
        {{ caption }}
      </p>
    </div>

    <p :class="valueClass">
      <slot name="value">
        {{ value }}
      </slot>
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue";

const toneMap = {
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    heading: "text-indigo-700",
    caption: "text-indigo-800",
    value: "text-indigo-900",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    heading: "text-emerald-700",
    caption: "text-emerald-800",
    value: "text-emerald-900",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-100",
    heading: "text-rose-700",
    caption: "text-rose-800",
    value: "text-rose-900",
  },
  slate: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    heading: "text-slate-700",
    caption: "text-slate-600",
    value: "text-slate-900",
  },
};

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  caption: {
    type: String,
    default: "",
  },
  value: {
    type: [String, Number],
    default: "",
  },
  tone: {
    type: String,
    default: "slate",
  },
});

const toneClasses = computed(() => toneMap[props.tone] || toneMap.slate);

const cardClass = computed(() => [
  "rounded-2xl border px-4 py-3 flex flex-col justify-between",
  toneClasses.value.bg,
  toneClasses.value.border,
]);

const valueClass = computed(
  () => `text-3xl font-bold ${toneClasses.value.value}`
);
</script>
