/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#121212',
          card: '#1e1e1e',
          accent: '#3b82f6',
          text: '#f3f4f6',
          muted: '#9ca3af'
        }
      }
    },
  },
  plugins: [],
}
