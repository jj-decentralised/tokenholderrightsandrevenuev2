import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: "#32b88d",
          hover: "#1d7464",
          light: "#e8f7f1",
          50: "#f0fdf7",
          600: "#32b88d",
          700: "#1d7464",
          800: "#133c3b",
        },
        surface: {
          bg: "#fcfcf9",
          card: "#fffffe",
          elevated: "#f7f7f5",
          hover: "#f2f2f0",
        },
        border: {
          DEFAULT: "#e5e5e3",
          light: "#eeeeec",
        },
        content: {
          DEFAULT: "#133c3b",
          muted: "#626c71",
          light: "#8f9a9e",
        },
        status: {
          success: "#32b88d",
          error: "#c0152f",
          warning: "#a84b2f",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
