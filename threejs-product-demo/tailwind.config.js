/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF6F0',
          100: '#F4ECE1',
          200: '#EADBC9',
          300: '#D9C2A9',
          400: '#C3A382',
          500: '#A9825F',
          600: '#8E6746',
          700: '#734E32',
          800: '#5A2611',
          900: '#411C0C',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 20px 40px -15px rgba(90, 38, 17, 0.08), 0 0 1px 1px rgba(90, 38, 17, 0.02)',
        'premium-hover': '0 30px 60px -15px rgba(90, 38, 17, 0.12), 0 0 1px 1px rgba(90, 38, 17, 0.04)',
      }
    },
  },
  plugins: [],
}
