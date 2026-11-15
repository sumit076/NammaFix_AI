/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#071a33', 900: '#0b2545', 800: '#13315c', 700: '#1b4079' },
        brand: { 50: '#eef4ff', 100: '#dbe8ff', 200: '#bcd3ff', 500: '#2f6fdd', 600: '#1f5ccc', 700: '#1a4cab' },
        ink: { 900: '#101828', 700: '#344054', 500: '#5b6677', 300: '#98a2b3' },
        line: '#e4e7ec',
        canvas: '#f5f7fa',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.06)',
      },
    },
  },
  plugins: [],
};
