/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      fontSize: {
        // Bump up the entire scale by ~1-2 steps
        xs:   ['0.8rem',   { lineHeight: '1.25rem' }],
        sm:   ['0.9rem',   { lineHeight: '1.4rem' }],
        base: ['1rem',     { lineHeight: '1.6rem' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl':['1.5rem',   { lineHeight: '2rem' }],
        '3xl':['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':['2.25rem',  { lineHeight: '2.6rem' }],
        '5xl':['3rem',     { lineHeight: '1.1' }],
        '6xl':['3.75rem',  { lineHeight: '1' }],
        '7xl':['4.5rem',   { lineHeight: '1' }],
      },
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        }
      },
      borderRadius: {
        'card': '20px',
        '2xl':  '16px',
        '3xl':  '24px',
      },
      boxShadow: {
        'card':  '0 4px 20px -2px rgba(0,0,0,0.06), 0 2px 8px -1px rgba(0,0,0,0.03)',
        'glow-blue': '0 0 40px rgba(37,99,235,0.25)',
        'glow-teal': '0 0 40px rgba(20,184,166,0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
