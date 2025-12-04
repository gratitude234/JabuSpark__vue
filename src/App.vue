<!-- src/App.vue -->
<template>
  <MainShell>
    <RouterView />
  </MainShell>
</template>

<script setup>
import { RouterView } from "vue-router";
import MainShell from "./layouts/MainShell.vue";
</script>
