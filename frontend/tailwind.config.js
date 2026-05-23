/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0A2463",
        secondary: "#EAF2EF",
        accent: "#FB3640",
      }
    },
  },
  plugins: [],
}
