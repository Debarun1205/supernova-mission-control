/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        abyss: 'var(--abyss)',
        hull: 'var(--hull)',
        'hull-raised': 'var(--hull-raised)',
        starlight: 'var(--starlight)',
        dust: 'var(--dust)',
        ion: 'var(--ion)',
        nominal: 'var(--nominal)',
        solar: 'var(--solar)',
        nova: 'var(--nova)',
        aurora: 'var(--aurora)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Unbounded', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
