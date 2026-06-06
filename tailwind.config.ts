import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
      },
      colors: {
        // Semantic dark palette (single source of truth for theming).
        background: "#0A0E14",
        surface: "#11161F",
        "surface-2": "#1A212C",
        border: "#232C38",
        foreground: "#E7ECF3",
        muted: "#9BA8B7",
        "muted-2": "#6A7686",
      },
    },
  },
  // tailwindcss-rtl: adds direction-aware utilities (ms-*, me-*, ps-*, pe-*, etc.)
  // so layouts mirror correctly under dir="rtl".
  plugins: [require("tailwindcss-rtl")],
};

export default config;
