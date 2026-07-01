/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Calm, technical palette: slate base with a signal-cyan accent.
        forge: {
          bg: '#0b1120',
          panel: '#111a2e',
          border: '#1e2a44',
          text: '#e2e8f0',
          muted: '#94a3b8',
          accent: '#22d3ee',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
