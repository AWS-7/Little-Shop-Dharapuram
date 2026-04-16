/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fdfbf7',
        'rose-gold': '#b76e79',
        // Luxury Purple Theme
        purple: {
          primary: '#6a1b9a',      // Deep Purple - buttons, accents
          secondary: '#4a148c',    // Darker Purple - headers
          light: '#f3e5f5',        // Lavender - backgrounds
          lighter: '#e1bee7',      // Soft Purple - borders, badges
          dark: '#38006b',         // Very Dark Purple - text
        },
        // Keep emerald for backward compatibility during transition
        emerald: {
          primary: '#6a1b9a', // Map to purple
        },
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        inter: ['"Inter"', 'sans-serif'],
        lato: ['"Lato"', 'sans-serif'],
      },
      maxWidth: {
        luxury: '1440px',
      },
    },
  },
  plugins: [],
};
