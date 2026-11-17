import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#2E5A9C",
        "brand-red": "#D62828",
        ink: "#1A2B4C",
        sun: "#FFC857", // warm highlight used sparingly on dark blue
        paper: "#F5F8FD", // page background, a hint of the brand blue
      },
      fontFamily: {
        sans: [
          "var(--font-poppins)",
          "var(--font-hind)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Noto Sans Devanagari",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,43,76,.06), 0 10px 24px -14px rgba(26,43,76,.22)",
        pop: "0 14px 30px -12px rgba(46,90,156,.5)",
        float: "0 10px 40px -8px rgba(26,43,76,.35)",
      },
      keyframes: {
        // Slide only, never hidden: content must be readable even if the animation is cut short.
        "fade-up": {
          "0%": { transform: "translateY(14px)" },
          "100%": { transform: "none" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        dash: { to: { strokeDashoffset: "-28" } },
        "pulse-dot": {
          "0%": { boxShadow: "0 0 0 0 rgba(22,163,74,.5)" },
          "70%": { boxShadow: "0 0 0 7px rgba(22,163,74,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(22,163,74,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .55s cubic-bezier(.2,.7,.2,1) both",
        float: "float 3.2s ease-in-out infinite",
        dash: "dash 1.6s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-out infinite",
      },
      minHeight: { tap: "48px" },
    },
  },
  plugins: [],
};
export default config;
