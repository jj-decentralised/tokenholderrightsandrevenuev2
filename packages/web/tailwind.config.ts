import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        terminal: {
          bg: "#0a0a0f",
          surface: "#12121a",
          border: "#1e1e2e",
          muted: "#6b7280",
          text: "#e5e7eb",
          accent: "#3b82f6",
          positive: "#10b981",
          negative: "#ef4444",
          warning: "#f59e0b",
          highlight: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
