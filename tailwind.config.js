/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Bắt buộc để Tailwind kích hoạt dark: khi <html> có class 'dark'
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
