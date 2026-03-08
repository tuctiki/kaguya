import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        pink: {
          500: "#ff0080",
          600: "#e60073",
        },
        cyan: {
          500: "#00f2ff",
          600: "#00d9e6",
        }
      },
    },
  },
  plugins: [],
};
export default config;
