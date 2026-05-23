/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          900: "#1a4a4a",  // darkest — navbar/hero/footer bg
          800: "#2a6b6b",  // dark — footer secondary bg
          600: "#3d8b8b",  // mid-dark — section accents
          500: "#5aadad",  // mid — buttons, icons
          300: "#8dd4d4",  // mid-light — icon tiles, borders
          100: "#c4eaea",  // light — chips, card borders
          50:  "#eaf7f7",  // lightest — page background
        },
        secondary: {
          DEFAULT: "#E8D5C4", // Lightest beige
          dark: "#D8B89C",
        },
        accent: {
          DEFAULT: "#C7A27C", // Mid tone
          light: "#D8B89C",
        },
        darkBg: "#0F172A",
        darkCard: "#161B22",
        darkHover: "#1E293B",
        activeMenu: "#3B82F6",
        textLight: "#F8FAFC",
        iconColor: "#CBD5E1",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
