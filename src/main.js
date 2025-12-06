// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css"; // Tailwind entry (base/components/utilities)

// PWA service worker registration (vite-plugin-pwa)
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Later you can hook this into your own toast system
    console.log("New version of Jabuspark is available. Refresh to update.");
  },
  onOfflineReady() {
    console.log("Jabuspark is ready to work offline.");
  },
});

const app = createApp(App);

app.use(router);

app.mount("#app");
