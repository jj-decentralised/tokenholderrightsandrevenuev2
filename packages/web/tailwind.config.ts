import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'EB Garamond'", "Georgia", "'Times New Roman'", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      colors: {
        wsj: {
          bg: "#ffffff",
          muted: "#f8f7f4",
          text: "#111111",
          secondary: "#444444",
          caption: "#888888",
          border: "#d0d0d0",
          rule: "#e8e8e8",
          blue: "#0274B6",
          green: "#1a7a2e",
          red: "#c0152f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
