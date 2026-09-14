/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        falcon: {
          bg: '#06080d',
          card: '#0c101a',
          surface: '#121826',
          border: '#1b2438',
          input: '#151d2e',
          text: '#f1f5f9',
          muted: '#94a3b8',
          blue: {
            DEFAULT: '#00a6ff',
            glow: '#00d2ff',
            dark: '#0072b8',
            deep: '#00477a',
            light: '#38bdf8'
          },
          silver: {
            DEFAULT: '#cbd5e1',
            light: '#f1f5f9',
            dark: '#64748b'
          }
        }
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 166, 255, 0.45)',
        'neon-blue-lg': '0 0 25px rgba(0, 166, 255, 0.65)',
        'falcon-card': '0 4px 20px -2px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(0, 166, 255, 0.15)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
};
