/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: '#7C3AED', hover: '#6D28D9' },
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
        info:    '#38BDF8',
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
      borderRadius: {
        sm: '8px', DEFAULT: '12px', lg: '16px', xl: '20px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.25)',
        sm: '0 2px 4px rgba(0,0,0,0.3)',
        md: '0 6px 16px rgba(0,0,0,0.35)',
        lg: '0 16px 40px rgba(0,0,0,0.45)',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4' }],
        xs:  ['11px', { lineHeight: '1.4' }],
        sm:  ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}