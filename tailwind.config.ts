import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#2E5A9C",
        "brand-red": "#D62828",
        ink: "#1A2B4C",
      },
      minHeight: { tap: "48px" },
    },
  },
  plugins: [],
};
export default config;
