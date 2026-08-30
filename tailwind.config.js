/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        usopen: { blue: '#00539f', navy: '#0c2340', yellow: '#f2c700' },
      },
    },
  },
  plugins: [],
};
