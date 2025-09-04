import type { Config } from 'tailwindcss';

// Minimal Tailwind config placeholder for T15 bootstrap
export default {
  content: [
    './app/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

