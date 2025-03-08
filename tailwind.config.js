/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'link-blue': '#30b2ff',
      },
    },
  },
  plugins: [
    typography,
  ],
};
