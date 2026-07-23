/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../doc/**/*.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        hms: {
          surface: '#f6fafe',
          'surface-dim': '#d6dade',
          'surface-low': '#f0f4f8',
          'surface-container': '#eaeef2',
          'surface-high': '#e4e9ed',
          'on-surface': '#171c1f',
          'on-surface-variant': '#3f4851',
          outline: '#707882',
          'outline-variant': '#bfc7d2',
          primary: '#006096',
          'primary-container': '#007abc',
          'primary-fixed': '#cee5ff',
          'on-primary-fixed': '#001d32',
          secondary: '#48626e',
          'secondary-container': '#cbe7f5',
          tertiary: '#006673',
          'tertiary-container': '#008091',
          accent: '#55d7ed',
          success: '#1a7a4a',
          'success-bg': '#d4f4e2',
          warning: '#a05c00',
          'warning-bg': '#ffecd4',
          info: '#004e8c',
          'info-bg': '#dbeafe',
        },
      },
      boxShadow: {
        'hms-button':
          '0 10px 15px -3px rgba(0, 96, 150, 0.2), 0 4px 6px -4px rgba(0, 96, 150, 0.2)',
        'hms-card': '0 2px 12px rgba(0, 96, 150, 0.08), 0 1px 3px rgba(0, 96, 150, 0.04)',
      },
    },
  },
  plugins: [],
};

module.exports = config;
