/** @type {import('tailwindcss').Config} */
/**
 * Token names (ink / sand / ember) are kept for compatibility.
 * Hex values map to SteadyStream black + gold brand (steadystreamtv / stream-joy-unleashed).
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#000000',
          900: '#0f0f0f',
          850: '#121212',
          800: '#181818',
          700: '#222222',
          600: '#2e2e2e',
        },
        sand: {
          50: '#f7f1df',
          100: '#efe4c4',
          200: '#d4c08a',
          300: '#c0a080',
        },
        ember: {
          300: '#f5dd82',
          400: '#d4af37',
          500: '#cfb53b',
          600: '#b8860b',
        },
        mist: {
          300: '#c9b896',
          400: '#a8946e',
          500: '#7a6a4e',
        },
      },
      fontFamily: {
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        body: ['"Sora"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(212, 175, 55, 0.22)',
        panel: '0 24px 80px rgba(0, 0, 0, 0.55)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        'hero-wash':
          'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(212,175,55,0.14), transparent 55%), radial-gradient(ellipse 60% 50% at 10% 80%, rgba(184,134,11,0.12), transparent 50%), linear-gradient(165deg, #0f0f0f 0%, #000000 45%, #121212 100%)',
        'gold-gradient': 'linear-gradient(to bottom right, #D4AF37, #B8860B)',
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
