/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090d',
          900: '#0c1018',
          850: '#121826',
          800: '#171f2e',
          700: '#1f2a3d',
          600: '#2a3a52',
        },
        sand: {
          50: '#f7f3eb',
          100: '#efe6d6',
          200: '#dcc9a8',
          300: '#c4a97a',
        },
        ember: {
          400: '#e8a045',
          500: '#d4892a',
          600: '#b86f1c',
        },
        mist: {
          300: '#9aafc4',
          400: '#7a93ad',
          500: '#5c738c',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Sora"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(232, 160, 69, 0.18)',
        panel: '0 24px 80px rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        'hero-wash':
          'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(232,160,69,0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 10% 80%, rgba(90,120,160,0.16), transparent 50%), linear-gradient(165deg, #0c1018 0%, #07090d 45%, #0a0e16 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        shimmer: 'shimmer 2.2s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
