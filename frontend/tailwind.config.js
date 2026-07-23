/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Be Vietnam Pro"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        'hms-button':
          '0 10px 15px -3px rgba(0, 96, 150, 0.2), 0 4px 6px -4px rgba(0, 96, 150, 0.2)',
      },
    },
  },
  plugins: [],
};

module.exports = config;
