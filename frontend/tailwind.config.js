/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'spring-wood': '#f8f6f1',
          'gray-nurse': '#e1eae5',
          'moss-green': '#a7d7b8',
          'moss-green-dark': '#86b697',
          'moss-green-darker': '#76a687',
          'tradewind': '#66b2a0',
          'como': '#4e796b',
        },
        fontFamily: {
          'google-sans': ['Google Sans', 'Roboto', 'sans-serif'],
        },
        animation: {
          'fadeIn': 'fadeIn 0.3s ease-in-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          }
        }
      },
    },
    plugins: [],
  }