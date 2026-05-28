/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#bcd2ff',
          300: '#8ab4ff',
          400: '#5a91ff',
          500: '#2d6fe8',
          600: '#1556d4',
          700: '#1244b0',
          800: '#15388a',
          900: '#153169',
          950: '#0d1b3d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}