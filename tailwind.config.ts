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
          bg: "rgb(var(--space-bg) / <alpha-value>)",
          deep: "rgb(var(--space-deep) / <alpha-value>)",
          surface: "rgb(var(--space-surface) / <alpha-value>)",
          surface2: "rgb(var(--space-surface2) / <alpha-value>)",
          border: "rgb(var(--space-border) / <alpha-value>)",
          borderlight: "rgb(var(--space-borderlight) / <alpha-value>)",
        },
        neon: {
          cyan: "rgb(var(--neon-cyan) / <alpha-value>)",
          blue: "rgb(var(--neon-blue) / <alpha-value>)",
          violet: "rgb(var(--neon-violet) / <alpha-value>)",
          pink: "rgb(var(--neon-pink) / <alpha-value>)",
        },
        ink: {
          primary: "rgb(var(--ink-primary) / <alpha-value>)",
          secondary: "rgb(var(--ink-secondary) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        accent: {
          fg: "rgb(var(--accent-fg) / <alpha-value>)",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-cyan": "0 0 0 1px rgb(var(--neon-cyan) / 0.25), 0 8px 30px -10px rgb(var(--neon-cyan) / 0.35)",
        "glow-violet": "0 0 0 1px rgb(var(--neon-violet) / 0.25), 0 8px 30px -10px rgb(var(--neon-violet) / 0.35)",
        "glow-soft": "0 8px 30px -12px rgb(var(--neon-blue) / 0.25)",
        card: "var(--shadow-card)",
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
