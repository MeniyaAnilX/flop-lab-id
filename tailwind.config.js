/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hacker: {
          bg: "#000000",
          card: "#09090b",
          border: "#27272a",
          borderHover: "#52525b",
          text: "#ffffff",
          dim: "#a1a1aa",
          muted: "#71717a",
          green: "#00FF66",
          greenGlow: "#39ff14",
          cyan: "#00F0FF"
        }
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'Courier', 'monospace'],
        display: ['"Outfit"', '"IBM Plex Mono"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'matrix-scan': 'scanline 8s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glitch': 'glitch 1s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
