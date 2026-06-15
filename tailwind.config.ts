import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        space: {
          bg: "#060814",
          deep: "#0a0e1f",
          surface: "#11162b",
          surface2: "#171d38",
          border: "#2a3354",
          borderlight: "#3b4674",
        },
        neon: {
          cyan: "#22d3ee",
          blue: "#60a5fa",
          violet: "#a78bfa",
          pink: "#f472b6",
        },
        ink: {
          primary: "#eef2ff",
          secondary: "#aab4d4",
          muted: "#7c87ad",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-cyan": "0 0 0 1px rgba(34,211,238,0.25), 0 8px 30px -10px rgba(34,211,238,0.35)",
        "glow-violet": "0 0 0 1px rgba(167,139,250,0.25), 0 8px 30px -10px rgba(167,139,250,0.35)",
        "glow-soft": "0 8px 30px -12px rgba(96,165,250,0.25)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 30px -15px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { opacity: "1", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "twinkle": {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.45s ease-out both",
        "pop-in": "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        "twinkle": "twinkle 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
