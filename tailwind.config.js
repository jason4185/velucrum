/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7B3FE4",
        dark: "#0A0A0F",
        card: "#13131A",
        border: "#1E1E2E",
      },
    },
  },
  plugins: [],
};
