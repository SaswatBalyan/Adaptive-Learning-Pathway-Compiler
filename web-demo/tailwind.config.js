/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FBFBFA",
        surface: "#FFFFFF",
        border: "#EAEAEA",
        text: "#111111",
        "text-muted": "#787774",
        "accent-success-bg": "#EDF3EC",
        "accent-success-fg": "#346538",
        "accent-error-bg": "#FDEBEC",
        "accent-error-fg": "#9F2F2D",
        "accent-running-bg": "#E1F3FE",
        "accent-running-fg": "#1F6C9F",
      }
    },
  },
  plugins: [],
}