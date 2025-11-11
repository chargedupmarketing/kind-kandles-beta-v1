/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        candle: {
          flame: "var(--candle-flame)",
          glow: "var(--candle-glow)",
          cream: "var(--wax-cream)",
          brown: "var(--wick-brown)",
          amber: "var(--warm-amber)",
          vanilla: "var(--soft-vanilla)",
          orange: "var(--cozy-orange)",
          lavender: "var(--gentle-lavender)",
        },
        brand: {
          teal: "var(--brand-teal)",
          'teal-dark': "var(--brand-teal-dark)",
          'teal-light': "var(--brand-teal-light)",
        },
      },
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'script': ['Dancing Script', 'cursive'],
        'sans': ['Inter', 'sans-serif'],
      },
      animation: {
        'flicker': 'flicker 2s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

