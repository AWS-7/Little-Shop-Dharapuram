/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Professional Purple & White Theme
        purple: {
          primary: '#6A0DAD',      // Deep Purple - Primary Brand Color
          secondary: '#7B2CBF',    // Slightly Lighter Purple
          accent: '#E0AAFF',       // Soft Lavender for highlights
          light: '#F8F4FF',        // Very Light Purple for backgrounds
          dark: '#3C096C',         // Deepest Purple for text contrast
        },
        white: {
          DEFAULT: '#FFFFFF',
          soft: '#F8F9FA',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        inter: ['"Inter"', 'sans-serif'],
      },
      maxWidth: {
        site: '1280px',
      },
    },
  },
  plugins: [],
};
