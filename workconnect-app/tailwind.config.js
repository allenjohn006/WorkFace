/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0C4A8F',
          50: '#E8F0FB',
          100: '#C5D8F5',
          500: '#1565C0',
          700: '#0C4A8F',
          900: '#062B5B',
        },
        accent: {
          DEFAULT: '#E85D04',
          light: '#FF8C42',
          dark: '#BF4A00',
        },
        background: '#F5F7FA',
        success: '#1B5E20',
        error: '#B71C1C',
        text: {
          primary: '#1A1A2E',
          secondary: '#5C5C7B',
          muted: '#9898B0',
        },
        surface: '#FFFFFF',
        border: '#E0E4EF',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
