<template>
  <div :class="wrapperClass">
    <div
      class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold shrink-0"
      :class="[tone.iconBg, tone.iconText]"
    >
      <span class="leading-none">{{ iconToShow }}</span>
    </div>

    <div class="flex-1 space-y-1">
      <p class="text-sm font-semibold text-brand-dark">
        {{ title }}
      </p>
      <p v-if="message" class="text-xs text-muted">
        {{ message }}
      </p>
      <div v-if="$slots.actions" class="pt-1">
        <slot name="actions" />
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  tone: {
    type: String,
    default: "info", // info, success, warning, danger, muted
  },
  icon: {
    type: String,
    default: "",
  },
});

const toneMap = {
  info: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    iconBg: "bg-slate-200",
    iconText: "text-slate-800",
  },
  muted: {
    bg: "bg-slate-50/70",
    border: "border-slate-200",
    iconBg: "bg-slate-200",
    iconText: "text-slate-700",
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-200",
    iconText: "text-emerald-800",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-200",
    iconText: "text-amber-800",
  },
  danger: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    iconBg: "bg-rose-200",
    iconText: "text-rose-800",
  },
};

const iconDefaults = {
  info: "i",
  muted: "...",
  success: "ok",
  warning: "!",
  danger: "!",
};

const tone = computed(() => toneMap[props.tone] || toneMap.info);
const iconToShow = computed(
  () => props.icon || iconDefaults[props.tone] || "i"
);

const wrapperClass = computed(() => [
  "flex items-start gap-3 rounded-2xl border px-4 py-3",
  tone.value.bg,
  tone.value.border,
]);
</script>
