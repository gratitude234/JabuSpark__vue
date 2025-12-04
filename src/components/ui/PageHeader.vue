<template>
  <header
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div class="space-y-1">
      <p
        v-if="eyebrow || $slots.eyebrow"
        class="text-[11px] font-semibold uppercase tracking-wide text-brand"
      >
        <slot name="eyebrow">
          {{ eyebrow }}
        </slot>
      </p>

      <h1 class="text-2xl sm:text-3xl font-bold text-brand-dark">
        {{ title }}
      </h1>

      <p v-if="subtitle" class="text-sm text-muted">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
  eyebrow: {
    type: String,
    default: "",
  },
});
</script>
