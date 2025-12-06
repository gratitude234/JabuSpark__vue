// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",

      // Enable PWA in dev so you can test install
      devOptions: {
        enabled: true,
        type: "module",
      },

      manifest: {
        name: "Jabuspark",
        short_name: "Jabuspark",
        description: "AI-powered study hub for uni students.",
        theme_color: "#0f172a",
        background_color: "#020617",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",

        icons: [
          {
            src: "/pwa-192x192.png", // your JS lightning logo (192x192)
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png", // your JS lightning logo (512x512)
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512-maskable.png", // maskable version
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});
