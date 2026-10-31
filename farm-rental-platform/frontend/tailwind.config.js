/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7EF',
        canopy: {
          50: '#EEF4EE',
          100: '#D6E5D4',
          200: '#AECBAA',
          300: '#84AE7E',
          400: '#5C8F55',
          500: '#3E6E38',
          600: '#2C5427',
          700: '#1F4D36',
          800: '#173B29',
          900: '#102A1D',
        },
        harvest: {
          100: '#F7E7C1',
          300: '#EFC66B',
          500: '#D4A017',
          600: '#B0830F',
          700: '#8C670C',
        },
        soil: '#5B4636',
        sage: '#7C9473',
        clay: '#C7734A',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 77, 54, 0.15)',
        card: '0 4px 20px rgba(23, 59, 41, 0.08)',
      },
      backgroundImage: {
        'field-gradient': 'linear-gradient(135deg, #1F4D36 0%, #3E6E38 55%, #5C8F55 100%)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
