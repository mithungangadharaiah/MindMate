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
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        warm: {
          50: '#fefdf9',
          100: '#fef7ed',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#fcd34d',
          500: '#fbbf24',
          600: '#f59e0b',
          700: '#d97706',
          800: '#b45309',
          900: '#92400e',
        },
        calm: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'handwriting': ['Comfortaa', 'cursive'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-gentle': 'bounce 2s ease-in-out infinite',
        'gradient': 'gradient 6s ease infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #ff6b6b, #feca57, #48cae4)',
        'gradient-calm': 'linear-gradient(135deg, #a8e6cf, #7fcdcd)',
        'gradient-sad': 'linear-gradient(135deg, #d3d3d3, #a8a8a8)',
        'gradient-happy': 'linear-gradient(135deg, #ff9ff3, #48cae4)',
        'gradient-anxious': 'linear-gradient(135deg, #ffb3ba, #ffdfba)',
        'gradient-angry': 'linear-gradient(135deg, #ff6b6b, #ffa726)',
        'gradient-neutral': 'linear-gradient(135deg, #e1e5e9, #c7cdd3)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 107, 107, 0.3)',
        'glow-calm': '0 0 20px rgba(168, 230, 207, 0.3)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}