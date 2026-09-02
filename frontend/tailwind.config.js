/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        secondary: '#F59E0B',
        accent: '#10B981',
        'primary-light': '#3B82F6',
        'secondary-light': '#FBBF24',
      }
    },
  },
  plugins: [],
}