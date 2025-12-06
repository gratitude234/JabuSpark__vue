// src/composables/usePwaInstall.js
import { ref, onMounted, onUnmounted } from "vue";

const canInstall = ref(false);
const isInstalled = ref(false);
let deferredPrompt = null;

let beforeInstallHandler = null;
let appInstalledHandler = null;

export function usePwaInstall() {
  const showBanner = ref(false);

  const promptInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    canInstall.value = false;

    if (outcome === "accepted") {
      showBanner.value = false;
      localStorage.setItem("jp_hide_pwa_banner", "installed");
    }
  };

  const hideBanner = () => {
    showBanner.value = false;
    localStorage.setItem("jp_hide_pwa_banner", "dismissed");
  };

  onMounted(() => {
    // If already running as an installed app, don't show banner
    if (window.matchMedia("(display-mode: standalone)").matches) {
      isInstalled.value = true;
      return;
    }

    // Respect previous dismissal/install
    const flag = localStorage.getItem("jp_hide_pwa_banner");
    if (flag === "dismissed" || flag === "installed") return;

    beforeInstallHandler = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      canInstall.value = true;
      showBanner.value = true;
    };

    appInstalledHandler = () => {
      isInstalled.value = true;
      showBanner.value = false;
      localStorage.setItem("jp_hide_pwa_banner", "installed");
    };

    window.addEventListener("beforeinstallprompt", beforeInstallHandler);
    window.addEventListener("appinstalled", appInstalledHandler);
  });

  onUnmounted(() => {
    if (beforeInstallHandler) {
      window.removeEventListener("beforeinstallprompt", beforeInstallHandler);
    }
    if (appInstalledHandler) {
      window.removeEventListener("appinstalled", appInstalledHandler);
    }
  });

  return {
    canInstall,
    isInstalled,
    showBanner,
    promptInstall,
    hideBanner,
  };
}
