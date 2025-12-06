<!-- src/components/PwaInstallBanner.vue -->
<template>
  <transition name="slide-up">
    <div
      v-if="showBanner && canInstall && !isInstalled"
      class="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 sm:px-6"
    >
      <div
        class="max-w-xl w-full rounded-2xl bg-slate-900 text-slate-50 shadow-xl shadow-slate-900/40 border border-slate-700 px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3"
      >
        <!-- Icon / Logo -->
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 overflow-hidden"
        >
          <!-- If you want your real logo here, swap this span for an <img> -->
          <span class="text-xs font-semibold tracking-tight">JS</span>
        </div>

        <!-- Text -->
        <div class="flex-1">
          <p class="text-sm font-semibold">
            Install Jabuspark
          </p>
          <p class="text-xs text-slate-300">
            Add Jabuspark to your home screen for faster access and better offline
            support.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="hideBanner"
            class="text-[11px] text-slate-400 hover:text-slate-200"
          >
            Not now
          </button>
          <button
            type="button"
            @click="promptInstall"
            class="inline-flex items-center rounded-full bg-indigo-400 px-3 py-1.5 text-[11px] font-semibold text-slate-900 shadow hover:bg-indigo-300"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { usePwaInstall } from "@/composables/usePwaInstall";

const { canInstall, isInstalled, showBanner, promptInstall, hideBanner } =
  usePwaInstall();
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.22s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
