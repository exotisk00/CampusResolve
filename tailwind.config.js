/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // ─── Color Tokens (Light Theme Revision) ──────────────────────────────
      colors: {
        // Background layers (clean white & light blue-grey)
        'bg-base':     '#F8FAFC',
        'bg-surface':  '#FFFFFF',
        'bg-subtle':   '#F1F5F9',
        'bg-elevated': '#FFFFFF',
        'bg-blue-tint':'#EFF6FF',

        // Brand palette (vivid blue accent)
        'brand': {
          blue:        '#1F47E8',
          'blue-hover':'#1738C0',
          'blue-mid':  '#3B82F6',
          'blue-light':'#DBEAFE',
          'blue-pale': '#EFF6FF',
          navy:        '#0B132B',
        },

        // Text colors (Dark navy & charcoal for superior contrast)
        'content': {
          heading:   '#0B132B',
          primary:   '#1E293B',
          secondary: '#475569',
          muted:     '#64748B',
        },

        // Border colors
        'border-ui': {
          subtle:  '#E2E8F0',
          default: '#CBD5E1',
          focus:   '#1F47E8',
        },

        // Status
        'status': {
          pending:     '#F59E0B',
          'in-progress': '#1F47E8',
          resolved:    '#10B981',
          escalated:   '#EF4444',
          closed:      '#64748B',
        },
      },

      // ─── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        'display': ['3.5rem',  { lineHeight: '1.12', fontWeight: '800' }],
        'h1':      ['2.5rem',  { lineHeight: '1.2',  fontWeight: '800' }],
        'h2':      ['2rem',    { lineHeight: '1.25', fontWeight: '700' }],
        'h3':      ['1.5rem',  { lineHeight: '1.3',  fontWeight: '700' }],
        'h4':      ['1.25rem', { lineHeight: '1.35', fontWeight: '600' }],
        'h5':      ['1.125rem',{ lineHeight: '1.4',  fontWeight: '600' }],
        'h6':      ['0.9375rem',{ lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem',{ lineHeight: '1.75', fontWeight: '400' }],
        'body-md': ['0.9375rem',{ lineHeight: '1.65', fontWeight: '400' }],
        'body-sm': ['0.8125rem',{ lineHeight: '1.6',  fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1.5',  fontWeight: '500' }],
        'overline':['0.6875rem',{ lineHeight: '1.4', fontWeight: '700' }],
      },

      // ─── Spacing (4px base) ────────────────────────────────────────────────
      spacing: {
        '1':  '4px',
        '2':  '8px',
        '3':  '12px',
        '4':  '16px',
        '5':  '20px',
        '6':  '24px',
        '8':  '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },

      // ─── Border Radius ─────────────────────────────────────────────────────
      borderRadius: {
        'xs':   '4px',
        'sm':   '6px',
        'md':   '8px',
        'lg':   '12px',
        'xl':   '16px',
        '2xl':  '20px',
        '3xl':  '28px',
        'full': '9999px',
      },

      // ─── Soft Light-Theme Box Shadows ──────────────────────────────────────
      boxShadow: {
        'card':       '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 10px 15px -3px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'elevated':   '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)',
        'brand':      '0 4px 14px 0 rgba(31, 71, 232, 0.28)',
        'brand-hover':'0 6px 20px 0 rgba(31, 71, 232, 0.38)',
        'subtle':     '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
      },

      // ─── Breakpoints ───────────────────────────────────────────────────────
      screens: {
        'xs':  '375px',
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [],
};
