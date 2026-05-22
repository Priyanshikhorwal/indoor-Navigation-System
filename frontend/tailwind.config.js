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
        teal: {
          900: "#1a4a4a",  // darkest — navbar/hero/footer bg
          800: "#2a6b6b",  // dark — footer secondary bg
          600: "#3d8b8b",  // mid-dark — section accents
          500: "#5aadad",  // mid — buttons, icons
          300: "#8dd4d4",  // mid-light — icon tiles, borders
          100: "#c4eaea",  // light — chips, card borders
          50:  "#eaf7f7",  // lightest — page background
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
