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
          start: "#F09819",
          end: "#FF512F",
          primary: "#FF6B35",
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
