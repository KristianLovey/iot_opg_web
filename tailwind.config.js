/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Fraunces"', 'ui-serif', 'serif'],
      },
      colors: {
        ink: {
          900: '#16201a',
          800: '#1f2c22',
          700: '#2a3a2d',
          600: '#3d4f3f',
          500: '#5a6c5c',
          400: '#7f8e80',
          300: '#a8b3a8',
          200: '#cfd5cd',
          100: '#e8ebe5',
        },
        paper: {
          DEFAULT: '#f6f3ea',
          soft: '#efeadd',
          warm: '#ece5d2',
        },
        moss: {
          900: '#1b3818',
          800: '#264c20',
          700: '#2f5f27',
          600: '#3d7a31',
          500: '#56994a',
          400: '#7eb574',
          300: '#a8cf9f',
          200: '#cee3c7',
          100: '#e6efe2',
        },
        sand: { DEFAULT: '#c9a96e', light: '#e2cb9b', dark: '#a4853f' },
        clay: { DEFAULT: '#c25a2a', light: '#e4825a', dark: '#9c3f17' },
        sky: { DEFAULT: '#4a7a8c', light: '#7ea3b1', dark: '#33586a' },
        amber: { DEFAULT: '#d99a2b', light: '#e8b65d', dark: '#a87311' },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(22,32,26,0.04), 0 4px 12px rgba(22,32,26,0.04)',
        card: '0 1px 0 rgba(22,32,26,0.04), 0 2px 6px rgba(22,32,26,0.06)',
      },
    },
  },
  plugins: [],
};
