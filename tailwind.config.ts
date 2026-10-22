import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f0ff",
          100: "#e4e1ff",
          200: "#cbc5ff",
          500: "#6c5ce7",
          600: "#5a48d6",
          700: "#4a39b8",
          900: "#1f1a4d",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;