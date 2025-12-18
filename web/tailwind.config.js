/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        border: "var(--border)",
        primary: {
          DEFAULT: "#689F38", // Darkened from #7CB342 for contrast
          light: "#AEE571",
          dark: "#4B830D",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#E67E22", // Darkened from #F4A261 for contrast
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
        "neutral-dark": "#2A2A2A", // Keeping for backward compatibility
        "neutral-light": "#F8F9FA", // Keeping for backward compatibility
        success: "#4CAF50",
        warning: "#FFC107",
        error: "#F44336",
        info: "#2196F3",
      },
      fontFamily: {
        display: ["var(--font-playfair-display)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(124, 179, 66, 0.1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(10px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.8s ease-out",
        "fade-out": "fade-out 0.8s ease-out",
      },
    },
  },
  plugins: [],
};