/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
        colors: {
        secondary: '#059AA0', // your custom color here
        
      }
    },
  },
  plugins: [],
}
