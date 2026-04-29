import type { Config } from 'tailwindcss';

import { COLORS, TYPE_SCALE } from './lib/constants';

const px = (n: number) => `${n}px`;

const fontSize = Object.fromEntries(
  Object.entries(TYPE_SCALE).map(([key, [size, lh]]) => [
    key,
    [px(size), { lineHeight: px(lh) }],
  ]),
) as Record<keyof typeof TYPE_SCALE, [string, { lineHeight: string }]>;

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: COLORS,
      fontSize,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Source Serif Pro', 'Georgia', 'serif'],
      },
      letterSpacing: {
        eyebrow: '0.08em',
      },
    },
  },
  plugins: [],
} satisfies Config;
