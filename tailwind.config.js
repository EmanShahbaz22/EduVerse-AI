/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0c1333",
        "primary-light": "#3b82f6",
        "background-light": "#f6f6f8",
        "background-dark": "#13151f",
        'primary-navy': '#0F172A',
        'primary-light-blue': '#3b82f6',
        'background-light': '#f6f6f8',
        'background-dark': '#13151f',
        'text-light': '#f6f6f8',
        'text-dark': '#0c1333',
        'text-muted': '#6b7280',
        'border-light': '#e0e0e0',
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      animation: {
        'bounce': 'bounce 2s infinite',
        'pulse': 'pulse 2s infinite',
      },
      animationDelay: {
        '1000': '1000ms',
        '2000': '2000ms',
        '3000': '3000ms',
      }
    },
  },
  plugins: [],
};
