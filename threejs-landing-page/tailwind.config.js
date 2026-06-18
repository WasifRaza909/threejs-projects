/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./ether-design.html', './script.js'],
  theme: {
    extend: {
      fontFamily: {
        syne:    ['Syne', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      screens: { xs: '480px' },
    },
  },
  plugins: [],
}
