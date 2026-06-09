/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEEEFB",
          100: "#D6D7F5",
          200: "#AAAFE9",
          300: "#7E86DE",
          400: "#4F58C9",
          500: "#272C68",
          600: "#1E245E",
          700: "#111B4D",
          800: "#0C1338",
          900: "#070B24",
          950: "#040718",
        },
        accent: {
          50: "#FFFDF0",
          100: "#FFF9D6",
          200: "#FFF2A8",
          300: "#FFEB7A",
          400: "#FFE34D",
          500: "#FFD633",
          600: "#E6BF00",
          700: "#B39500",
          800: "#806B00",
          900: "#4D4000",
        },
        wave: {
          DEFAULT: "#00B3FF",
          light: "#E6F7FF",
        },
        whatsapp: {
          DEFAULT: "#25D366",
          light: "#E8FBF0",
        },
        surface: {
          DEFAULT: "#F8F9FC",
          card: "#FFFFFF",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        modal: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1)",
        sidebar: "2px 0 8px rgba(0,0,0,0.06)",
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
