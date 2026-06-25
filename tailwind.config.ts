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
        /* Couleurs arcade : Technologie=ambre, SNT=cyan, NSI=magenta */
        techno: "rgb(var(--arcade-techno) / <alpha-value>)",
        snt: "rgb(var(--arcade-snt) / <alpha-value>)",
        nsi: "rgb(var(--arcade-nsi) / <alpha-value>)",
        "techno-txt": "rgb(var(--techno-txt) / <alpha-value>)",
        "snt-txt": "rgb(var(--snt-txt) / <alpha-value>)",
        "nsi-txt": "rgb(var(--nsi-txt) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 0 1px rgb(var(--neon-cyan) / 0.25), 0 8px 30px -10px rgb(var(--neon-cyan) / 0.35)",
        "glow-violet": "0 0 0 1px rgb(var(--neon-violet) / 0.25), 0 8px 30px -10px rgb(var(--neon-violet) / 0.35)",
        "glow-soft": "0 8px 30px -12px rgb(var(--neon-blue) / 0.25)",
        card: "var(--shadow-card)",
        "arcade-sm": "3px 3px 0 rgb(var(--arcade-shadow-clr))",
        "arcade": "5px 5px 0 rgb(var(--arcade-shadow-clr))",
        "arcade-lg": "7px 8px 0 rgb(var(--arcade-shadow-clr))",
      },
      keyframes: {
        "blink": { "50%": { opacity: "0" } },
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
        "blink": "blink 1s steps(2) infinite",
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
