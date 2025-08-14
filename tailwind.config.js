/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  safelist: [
    // Dynamic color classes for color customization system
    // Text colors (used in color picker)
    'text-blue-700', 'text-blue-400', 'text-red-700', 'text-red-400',
    'text-green-700', 'text-green-400', 'text-yellow-600', 'text-yellow-400',
    'text-purple-700', 'text-purple-400', 'text-pink-700', 'text-pink-400',
    'text-indigo-700', 'text-indigo-400', 'text-gray-700', 'text-gray-400',
    'text-orange-700', 'text-orange-400', 'text-teal-700', 'text-teal-400',
    
    // Background colors (generated dynamically via replace)
    'bg-blue-700', 'bg-blue-400', 'bg-red-700', 'bg-red-400',
    'bg-green-700', 'bg-green-400', 'bg-yellow-600', 'bg-yellow-400',
    'bg-purple-700', 'bg-purple-400', 'bg-pink-700', 'bg-pink-400',
    'bg-indigo-700', 'bg-indigo-400', 'bg-gray-700', 'bg-gray-400',
    'bg-orange-700', 'bg-orange-400', 'bg-teal-700', 'bg-teal-400',
    
    // Hover text colors
    'hover:text-blue-800', 'hover:text-blue-300', 'hover:text-red-800', 'hover:text-red-300',
    'hover:text-green-800', 'hover:text-green-300', 'hover:text-yellow-700', 'hover:text-yellow-300',
    'hover:text-purple-800', 'hover:text-purple-300', 'hover:text-pink-800', 'hover:text-pink-300',
    'hover:text-indigo-800', 'hover:text-indigo-300', 'hover:text-gray-800', 'hover:text-gray-300',
    'hover:text-orange-800', 'hover:text-orange-300', 'hover:text-teal-800', 'hover:text-teal-300',
    
    // Hover background colors (generated dynamically via replace)
    'hover:bg-blue-800', 'hover:bg-blue-300', 'hover:bg-red-800', 'hover:bg-red-300',
    'hover:bg-green-800', 'hover:bg-green-300', 'hover:bg-yellow-700', 'hover:bg-yellow-300',
    'hover:bg-purple-800', 'hover:bg-purple-300', 'hover:bg-pink-800', 'hover:bg-pink-300',
    'hover:bg-indigo-800', 'hover:bg-indigo-300', 'hover:bg-gray-800', 'hover:bg-gray-300',
    'hover:bg-orange-800', 'hover:bg-orange-300', 'hover:bg-teal-800', 'hover:bg-teal-300',
    
    // Dark mode variants (already covered in patterns above but ensuring completeness)
    'dark:text-blue-400', 'dark:text-red-400', 'dark:text-green-400', 'dark:text-yellow-400',
    'dark:text-purple-400', 'dark:text-pink-400', 'dark:text-indigo-400', 'dark:text-gray-400',
    'dark:text-orange-400', 'dark:text-teal-400',
    
    'dark:hover:text-blue-300', 'dark:hover:text-red-300', 'dark:hover:text-green-300', 'dark:hover:text-yellow-300',
    'dark:hover:text-purple-300', 'dark:hover:text-pink-300', 'dark:hover:text-indigo-300', 'dark:hover:text-gray-300',
    'dark:hover:text-orange-300', 'dark:hover:text-teal-300',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        '3xl': '1600px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}