/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Jabuspark brand colors
        brand: {
          DEFAULT: "#4F46E5",   // main indigo
          dark: "#1E293B",      // deep slate / header
          soft: "#E0E7FF",      // soft indigo background
        },

        accent: "#22C55E",      // success / good score
        warning: "#F59E0B",     // warnings / deadlines
        danger: "#EF4444",      // errors / destructive

        // Layout / neutrals
        page: "#F3F4F6",        // app background
        surface: "#FFFFFF",     // cards
        muted: "#6B7280",       // secondary text
      },
    },
  },
  plugins: [],
};
