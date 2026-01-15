import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"]
      },
      colors: {
        brand: {
          start: "var(--color-brand-start)",
          end: "var(--color-brand-end)",
          primary: "var(--color-brand-primary)",
        }
      },
      boxShadow: {
        "a4": "0 0 4px rgba(0,0,0,0.25)"
      }
    }
  },
  plugins: []
};

export default config;
