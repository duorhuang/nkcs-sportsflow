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
        // 足球专区经典绿茵色调
        pitch: {
          dark: "#0A1A14",
          surface: "#0F261D",
          border: "#1E3D30",
          accent: "#10B981",
          chalk: "#E5E7EB",
        },
        // 排球专区经典室内暖阳枫木色调
        maple: {
          dark: "#1A1613",
          surface: "#241E1A",
          border: "#3D342E",
          orange: "#F97316",
          blue: "#2563EB",
          warm: "#F59E0B",
        },
        // 篮球专区美式拼花硬木经典色调
        hardwood: {
          dark: "#1C120F",
          surface: "#281A16",
          border: "#422C25",
          crimson: "#E11D48",
          amber: "#D97706",
          leather: "#B45309",
        },
        // 古典竞技学院质感专属点缀
        heritage: {
          gold: "#D4AF37",
          antiqueGold: "#C5A059",
          brass: "#B59A57",
          pewter: "#9CA3AF",
          bronze: "#92400E",
          parchment: "#FDFBF7",
          parchmentDark: "#1F1D1A",
          borderSubtle: "rgba(255, 255, 255, 0.08)",
          cardGlow: "rgba(212, 175, 55, 0.15)",
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
        chiseled: "inset 0 2px 4px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)",
        frameGold: "0 0 0 1px rgba(212, 175, 55, 0.4), 0 8px 24px rgba(0, 0, 0, 0.5)",
        framePewter: "0 0 0 1px rgba(156, 163, 175, 0.3), 0 8px 20px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
