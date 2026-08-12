/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B1220',
          900: '#121A2B',
          800: '#1A2540',
          700: '#243154',
          600: '#334268',
        },
        paper: {
          DEFAULT: '#F7F5EF',
          dim: '#EFEBDF',
        },
        brass: {
          DEFAULT: '#C9A227',
          light: '#E4C558',
          dark: '#9C7D1A',
        },
        ledger: {
          green: '#1F6F54',
          greenlight: '#E4F1EC',
          rust: '#B4432F',
          rustlight: '#F7E7E2',
        },
        line: {
          light: '#E4DFD1',
          dark: '#2A3547',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
