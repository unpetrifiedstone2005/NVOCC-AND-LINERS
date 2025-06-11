import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        afcontOrange1: '#904200',
        afcontDark: '#1F1F1F',
      },
      fontFamily: {
        times: ['"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
