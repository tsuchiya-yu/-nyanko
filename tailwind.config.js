/** @type {import('tailwindcss').Config} */
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
    require('@tailwindcss/typography'),
  ],
};
