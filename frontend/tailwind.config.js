/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iqoo: {
          bg: "#08090C",
          surface: "#101218",
          card: "#151821",
          elevated: "#1D212E",
          border: "rgba(255, 255, 255, 0.07)",
          borderGlow: "rgba(254, 229, 0, 0.35)",
          yellow: "#FEE500",
          amber: "#FFB800",
          orange: "#FF5500",
          blue: "#0088FF",
          cyan: "#00E5FF",
          textPrimary: "#F3F4F6",
          textSecondary: "#9CA3AF",
          textMuted: "#6B7280",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(254, 229, 0, 0.25)',
        'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.25)',
        'card-subtle': '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
