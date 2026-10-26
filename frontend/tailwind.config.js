/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Couleur principale (orange) : boutons, menu actif, liens, graphiques.
        brand: {
          50: "#FFF4EC",
          100: "#FFE4D1",
          200: "#FFC9A3",
          300: "#FFA86B",
          400: "#FF8A3D",
          500: "#F76707",
          600: "#E8590C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407",
        },
        // Encre : titres, textes et fonds sombres (gris bleute neutre).
        ink: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
          950: "#030712",
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
          DEFAULT: "#F7F6F3",
          card: "#FFFFFF",
          border: "#ECEAE6",
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
        card: "0 1px 2px rgba(17,24,39,0.04), 0 1px 3px rgba(17,24,39,0.04)",
        "card-hover": "0 6px 16px rgba(17,24,39,0.07), 0 2px 4px rgba(17,24,39,0.04)",
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
