/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8D6E63", // Darkest brown
          light: "#B08968",
        },
        secondary: {
          DEFAULT: "#E8D5C4", // Lightest beige
          dark: "#D8B89C",
        },
        accent: {
          DEFAULT: "#C7A27C", // Mid tone
          light: "#D8B89C",
        },
        darkBg: "#0F1117",
        darkCard: "#161B22",
        darkHover: "#1E293B",
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(141, 110, 99, 0.15)',
        'soft-lg': '0 10px 30px -3px rgba(141, 110, 99, 0.2)',
      }
    },
  },
  plugins: [],
}
