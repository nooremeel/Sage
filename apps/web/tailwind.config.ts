import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          200: 'var(--paper-200)',
        },
        surface: 'var(--surface)',
        rule: 'var(--rule)',
        ink: {
          900: 'var(--ink-900)',
          600: 'var(--ink-600)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          tint: 'var(--primary-tint)',
          foreground: 'var(--on-primary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--on-accent)',
        },
        sage: {
          300: 'var(--sage-300)',
          700: 'var(--sage-700)',
        },
        bg: 'var(--bg)',
        'bg-subtle': 'var(--bg-subtle)',
        card: 'var(--card)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        headline: ['var(--font-headline)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
