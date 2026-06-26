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
        // High fidelity enterprise dark theme
        bg: {
          dark: '#080B11',
          card: '#0F131C',
          hover: '#171C26',
          border: '#1E2530',
        },
        brand: {
          primary: '#5B67F2',
          primaryHover: '#4C58E0',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          accent: '#A78BFA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
