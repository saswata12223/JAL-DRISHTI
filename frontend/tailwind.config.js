/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yale: {
          DEFAULT: '#0F4C81',
          dark: '#0B3B66',
          light: '#1B65A4',
          subtle: 'rgba(15, 76, 129, 0.08)',
        },
        aqua: {
          DEFAULT: '#8FD3E8',
          light: '#BCE8F5',
          dark: '#58B9D8',
          subtle: 'rgba(143, 211, 232, 0.2)',
        },
        snow: {
          DEFAULT: '#F8FAFC',
          pure: '#FFFFFF',
          card: '#FFFFFF',
          muted: '#F1F5F9',
        },
        // App Theme Colors (Dark / Light responsive)
        app: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          'surface-elevated': 'var(--color-surface-elevated)',
          'surface-hover': 'var(--color-surface-hover)',
          border: 'var(--color-border)',
          'border-subtle': 'var(--color-border-subtle)',
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-muted': 'var(--color-text-muted)',
          accent: '#0F4C81',
          'accent-hover': '#0B3B66',
          'accent-subtle': 'rgba(15, 76, 129, 0.08)',
        },
        // Semantic Risk Colors
        risk: {
          extreme: '#DC2626',
          'extreme-subtle': 'rgba(220, 38, 38, 0.15)',
          high: '#F97316',
          'high-subtle': 'rgba(249, 115, 22, 0.15)',
          moderate: '#EAB308',
          'moderate-subtle': 'rgba(234, 179, 8, 0.15)',
          low: '#16A34A',
          'low-subtle': 'rgba(22, 163, 74, 0.15)',
        },
        // CWC Stage Colors
        cwc: {
          normal: '#16A34A',
          warning: '#EAB308',
          danger: '#DC2626',
          hfl: '#991B1B',
          offline: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-dark': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
