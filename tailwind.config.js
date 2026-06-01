/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-dim': 'var(--surface-dim)',
        'surface-lowest': 'var(--surface-lowest)',
        'surface-low': 'var(--surface-low)',
        'surface-container': 'var(--surface-container)',
        'surface-high': 'var(--surface-high)',
        'surface-highest': 'var(--surface-highest)',
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        primary: 'var(--primary)',
        'primary-container': 'var(--primary-container)',
        'on-primary': 'var(--on-primary)',
        'primary-fixed': 'var(--primary-fixed)',
        'primary-fixed-dim': 'var(--primary-fixed-dim)',
        secondary: 'var(--secondary)',
        'secondary-container': 'var(--secondary-container)',
        'on-secondary': 'var(--on-secondary)',
        tertiary: 'var(--tertiary)',
        'tertiary-container': 'var(--tertiary-container)',
        'on-tertiary': 'var(--on-tertiary)',
        'tertiary-fixed': 'var(--tertiary-fixed)',
        error: 'var(--error)',
        'error-container': 'var(--error-container)',
        'on-error': 'var(--on-error)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        'inverse-surface': 'var(--inverse-surface)',
        'inverse-on-surface': 'var(--inverse-on-surface)',
      },
      borderRadius: {
        'bento': 'var(--radius-bento)',
        'inner-panel': 'var(--radius-inner)',
      },
      gap: {
        'gutter': 'var(--gutter)',
      },
      spacing: {
        'margin-mobile': 'var(--margin-mobile)',
        'margin-desktop': 'var(--margin-desktop)',
      }
    },
  },
  plugins: [],
}
