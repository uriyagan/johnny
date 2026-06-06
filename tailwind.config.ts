import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
      },
    },
  },
  // tailwindcss-rtl: adds direction-aware utilities (ms-*, me-*, ps-*, pe-*, etc.)
  // so layouts mirror correctly under dir="rtl".
  plugins: [require("tailwindcss-rtl")],
};

export default config;
