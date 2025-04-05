/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./theme/**/*.html", "./content/**/*.md"],
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

