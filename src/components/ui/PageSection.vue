<template>
  <section :class="sectionClass">
    <slot />
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  padded: {
    type: Boolean,
    default: true,
  },
  divided: {
    type: Boolean,
    default: false,
  },
  flush: {
    type: Boolean,
    default: false,
  },
});

const sectionClass = computed(() => [
  "bg-surface/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm",
  props.padded ? "p-5 sm:p-6" : "",
  props.divided ? "divide-y divide-slate-200" : "",
  props.flush ? "p-0" : "",
]);
</script>
