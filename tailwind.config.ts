import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#EDF8F7",
        sage: {
          DEFAULT: "#1B5A52",
          light: "#4DBAB2",
          dark: "#0F3A34",
        },
        rust: {
          DEFAULT: "#D04020",
          light: "#F08060",
        },
        mustard: {
          DEFAULT: "#F0C038",
          light: "#F8D870",
        },
        navy: {
          DEFAULT: "#0F3A34",
          light: "#1B5A52",
        },
        blush: "#A8D8D4",
        "zone-west": "#D04020",
        "zone-central": "#1B7A70",
        "zone-east": "#C89010",
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease forwards",
        "fade-in": "fadeIn 0.2s ease forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
