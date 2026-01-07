import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        // Neo-brutalist color system
        'neo-cream': '#FFFDF5',
        'neo-accent': '#FF6B6B',
        'neo-secondary': '#FFD93D',
        'neo-muted': '#C4B5FD',
        black: '#000000',
        white: '#FFFFFF',
      },
      boxShadow: {
        'brutal-sm': '4px 4px 0px 0px #000',
        'brutal': '6px 6px 0px 0px #000',
        'brutal-md': '8px 8px 0px 0px #000',
        'brutal-lg': '12px 12px 0px 0px #000',
        'brutal-xl': '16px 16px 0px 0px #000',
        'brutal-white-lg': '12px 12px 0px 0px #fff',
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      borderWidth: {
        '3': '3px',
      },
      letterSpacing: {
        'widest': '0.2em',
      },
    },
  },
  plugins: [],
}

export default config
