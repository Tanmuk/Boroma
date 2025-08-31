/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { primary: { 400: "#FF8A3D", 500: "#FF5B04" } },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
