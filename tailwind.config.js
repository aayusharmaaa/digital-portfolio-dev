/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        display: ['var(--font-display)', 'sans-serif'],
      },
      colors: {
        terminal: {
          bg: '#0a0a0a',
          surface: '#111111',
          border: '#1f1f1f',
          green: '#00ff88',
          dim: '#333333',
          text: '#e0e0e0',
          muted: '#666666',
        },
      },
      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        blink: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
      },
    },
  },
  plugins: [],
};
