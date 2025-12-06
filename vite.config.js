// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
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
            src: "logo.jpg",        // 192 icon (uses same file)
            sizes: "192x192",
            type: "image/jpeg",
          },
          {
            src: "logo.jpg",        // 512 icon
            sizes: "512x512",
            type: "image/jpeg",
          },
          {
            src: "logo.jpg",        // maskable icon
            sizes: "512x512",
            type: "image/jpeg",
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
