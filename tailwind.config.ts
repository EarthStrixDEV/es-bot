import type { Config } from 'tailwindcss';

// Design tokens from "ES Bot — App Design" canvas.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        paper: '#FFFFFF',
        sand: '#F6F5F3', // panels, rails, soft surfaces
        chip: '#EDECEA', // secondary buttons, tracks, placeholders
        line: '#E6E4E0', // borders + 1px rings
        rule: '#C9C6C0', // connectors in diagrams
        muted: '#5E6268',
        sub: '#3A3D42',
        accent: { DEFAULT: '#2348D8', ink: '#1A36A8', soft: '#EEF1FD' },
        ok: { DEFAULT: '#15803D', ink: '#14532D', soft: '#E7F5EC' },
        warn: { DEFAULT: '#B45309', ink: '#8A4B08', soft: '#FFF4E5' },
        danger: { ink: '#8A1C1C', soft: '#FDECEC' },
        bot: {
          sales: '#E8590C',
          chief: '#7048E8',
          pos: '#1C7ED6',
          content: '#2F9E44',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        ring: '0 0 0 1px #E6E4E0',
        'ring-accent': '0 0 0 2px #2348D8',
        'ring-ink': '0 0 0 1px #0A0A0A',
        float: '0 0 0 2px #2348D8, 0 12px 32px rgba(10,10,10,0.10)',
        sheet: '0 -12px 40px rgba(10,10,10,0.14)',
        side: '-1px 0 0 #E6E4E0, -24px 0 48px rgba(10,10,10,0.08)',
      },
      borderRadius: {
        'bubble-out': '18px 18px 4px 18px',
        'bubble-in': '18px 18px 18px 4px',
      },
    },
  },
  plugins: [],
} satisfies Config;
