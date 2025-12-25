/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#BF3131',
          dark: '#7D0A0A',
          light: '#FFCCCC',
        },
        background: {
          light: '#F5F5F5',
          dark: '#1A1C20',
          card: {
            light: '#FFFFFF',
            dark: '#121212',
          }
        }
      },
      fontFamily: {
        sans: ['Mona Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
