import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        genesis: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        neon: {
          pink: "#ff2d87",
          purple: "#b94dff",
          blue: "#4d79ff",
          cyan: "#00e5ff",
        },
        surface: {
          DEFAULT: "#0a0a0f",
          raised: "#12121a",
          overlay: "#1a1a26",
          border: "#2a2a3a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      transitionDuration: {
        fast: "100ms",
        normal: "150ms",
        moderate: "200ms",
        slow: "300ms",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-in forwards",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "slide-down": "slide-down 0.4s ease-out forwards",
        "slide-in-left": "slide-in-left 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
        "modal-in": "modal-in 0.2s ease-out forwards",
        "modal-out": "modal-out 0.15s ease-in forwards",
        "toast-in": "toast-slide-in 0.3s ease-out forwards",
        "toast-out": "toast-slide-out 0.2s ease-in forwards",
        "heart-bounce": "heart-bounce 0.4s ease-in-out",
        "check-draw": "check-draw 0.4s ease-out forwards",
        "confetti-fall": "confetti-fall 1.5s ease-out forwards",
        "btn-press": "btn-press 0.1s ease-in-out",
        "spinner": "spinner 0.8s linear infinite",
        "spinner-dots": "spinner-dots 1.4s ease-in-out infinite",
        "skeleton-pulse": "skeleton-pulse 2s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "modal-in": {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "modal-out": {
          "0%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "100%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
        },
        "toast-slide-in": {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "toast-slide-out": {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(100%)" },
        },
        "heart-bounce": {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.3)" },
          "50%": { transform: "scale(0.95)" },
          "75%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "check-draw": {
          "0%": { strokeDashoffset: "24", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { strokeDashoffset: "0", opacity: "1" },
        },
        "confetti-fall": {
          "0%": { opacity: "1", transform: "translateY(0) rotate(0deg)" },
          "100%": { opacity: "0", transform: "translateY(300px) rotate(720deg)" },
        },
        "btn-press": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.97)" },
          "100%": { transform: "scale(1)" },
        },
        "spinner": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "spinner-dots": {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
        "skeleton-pulse": {
          "0%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
          "100%": { opacity: "0.4" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)" },
          "100%": { boxShadow: "0 0 40px rgba(168, 85, 247, 0.8), 0 0 80px rgba(168, 85, 247, 0.3)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168, 85, 247, 0.3), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
