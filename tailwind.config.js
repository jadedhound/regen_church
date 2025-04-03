/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./theme/**/*.html", "./content/**/*.md"],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        blackTransparent: 'rgba(0, 0, 0, 0.75)'
      },
      typography: {
        DEFAULT: {
          css: {
            h1: {
              fontWeight: '600',
              fontSize: '3rem',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              padding: '1rem',
              paddingTop: '2rem',
            },
            h2: {
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
              fontSize: '1.25rem',
              lineHeight: '1.5',
              color: '#f97316',
              borderBottomWidth: '3px',
              borderImage: 'linear-gradient(to right, #f97316 0, #f97316 30%, transparent 100%) 1'
            },
            h3: {
              fontSize: '1.25rem',
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
            a: {
              textTransform: 'capitalize',
              color: '#f59e0b'
            },
            strong: {
              color: '#ef4444'
            },
            table: {
              overflowX: 'auto',
              display: 'block',
            }
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

