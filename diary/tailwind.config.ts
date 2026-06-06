import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fbf8f3",
        surface: "#ffffff",
        ink: {
          DEFAULT: "#2c2416",
          light: "#6b5f4f",
          muted: "#b0a392",
        },
        rust: {
          DEFAULT: "#c46b4d",
          hover: "#a8583d",
        },
        linen: {
          DEFAULT: "#efe8dc",
          strong: "#d9cfbf",
        },
        glow: "#fdf3ea",
      },
      fontFamily: {
        serif: ["Noto Serif SC", "Source Han Serif SC", "STSong", "Songti SC", "serif"],
        sans: ["Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "sans-serif"],
        mono: ["SF Mono", "Cascadia Code", "JetBrains Mono", "monospace"],
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
