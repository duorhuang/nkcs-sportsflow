import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 足球专区经典绿茵色调（自然深墨绿草皮）
        pitch: {
          dark: "#0C1A14",
          surface: "#11261D",
          border: "#1E3B2E",
          accent: "#2D6A4F",
          chalk: "#F3F4F6",
        },
        // 排球专区经典室内暖枫木色调
        maple: {
          dark: "#16110D",
          surface: "#221B15",
          border: "#3B2F25",
          orange: "#C25E1A",
          blue: "#1E3A8A",
          warm: "#D97706",
        },
        // 篮球专区美式拼花硬木经典色调
        hardwood: {
          dark: "#18110D",
          surface: "#261A14",
          border: "#3E2B21",
          crimson: "#991B1B",
          amber: "#B45309",
          leather: "#854D0E",
        },
        // 古典竞技学院质感专属点缀（低调哑光铜金）
        heritage: {
          gold: "#C5A059",
          antiqueGold: "#B59247",
          brass: "#A1823B",
          pewter: "#94A3B8",
          bronze: "#78350F",
          parchment: "#FBF9F5",
          parchmentDark: "#1C1A17",
          borderSubtle: "rgba(255, 255, 255, 0.08)",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        cardNatural: "0 2px 8px rgba(0, 0, 0, 0.4)",
        frameGold: "0 0 0 1px rgba(197, 160, 89, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
