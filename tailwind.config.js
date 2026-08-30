/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'link-blue': '#30b2ff',
        brand: {
          50: '#FEF7D6',
          300: '#F3D66B',
          500: '#EBC34A',
          600: '#DDB22E',
        },
        ink: '#2F2F2F',
      },
    },
  },
  plugins: [typography],
};
