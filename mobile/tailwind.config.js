/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7CB342",
          light: "#AEE571",
          dark: "#4B830D",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F4A261",
          light: "#FFD38F",
          dark: "#BF7335",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#A5D6A7",
          foreground: "#1B5E20",
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EEEEEE",
          300: "#E0E0E0",
          400: "#BDBDBD",
          500: "#9E9E9E",
          600: "#757575",
          700: "#616161",
          800: "#424242",
          900: "#212121",
        },
        success: "#4CAF50",
        warning: "#FFC107",
        error: "#F44336",
        info: "#2196F3",
      },
      fontFamily: {
        display: ["System", "serif"], // Mobile fallback
        body: ["System", "sans-serif"],
      },
    },
  },
  plugins: [],
}

