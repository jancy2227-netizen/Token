/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          dark: '#142740',
          light: '#284d7d'
        },
        secondary: {
          DEFAULT: '#2F6690',
          dark: '#224a69',
          light: '#3d83b8'
        },
        accent: {
          DEFAULT: '#6FA3C8',
          light: '#e8f2f8',
          dark: '#5185a9'
        },
        success: {
          DEFAULT: '#4B7B57',
          light: '#eaf4ec',
          dark: '#385c41'
        },
        warning: {
          DEFAULT: '#B8862E',
          light: '#fdf8ee',
          dark: '#8c6520'
        },
        danger: {
          DEFAULT: '#9A3324',
          light: '#faeae8',
          dark: '#74261a'
        },
        bgLight: '#F5F7FA',
        cardBg: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(30, 58, 95, 0.08)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'ticket': '0 10px 25px -5px rgba(30, 58, 95, 0.15), 0 8px 10px -6px rgba(30, 58, 95, 0.1)',
      }
    },
  },
  plugins: [],
}
