/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Professional Teal & White Theme
        purple: {
          primary: '#0D9488',      // Teal 600 - Primary Brand Color
          secondary: '#14B8A6',    // Teal 500 - Slightly Lighter Teal
          accent: '#5EEAD4',       // Teal 300 - Soft Teal for highlights
          light: '#F0FDFA',        // Teal 50 - Very Light Teal for backgrounds
          dark: '#134E4A',         // Teal 900 - Deepest Teal for text contrast
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
        sans: ['"Inter"', 'sans-serif'],
      },
      maxWidth: {
        site: '1280px',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
