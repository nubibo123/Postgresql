/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core surfaces
        'void': '#060810',
        'surface': '#0d1120',
        'surface-2': '#121826',
        'surface-3': '#181e2e',
        'surface-4': '#1e2538',

        // Borders
        'border': 'rgba(255, 255, 255, 0.06)',
        'border-subtle': 'rgba(255, 255, 255, 0.04)',
        'border-strong': 'rgba(255, 255, 255, 0.12)',

        // Text
        'sand': '#c8cfe0',
        'sand-bright': '#eef0f8',
        'sand-dim': '#6b7494',
        'sand-muted': '#4a5068',

        // Amber accent (primary)
        'amber': '#d4aa64',
        'amber-bright': '#e0bb78',
        'amber-dim': '#b08f4e',
        'amber-surface': 'rgba(212, 170, 100, 0.08)',
        'amber-border': 'rgba(212, 170, 100, 0.2)',

        // Semantic
        'success': '#34d399',
        'success-surface': 'rgba(16, 185, 129, 0.1)',
        'warning': '#fbbf24',
        'warning-surface': 'rgba(245, 158, 11, 0.1)',
        'danger': '#f87171',
        'danger-surface': 'rgba(239, 68, 68, 0.1)',

        // Legacy aliases (keep compatibility with old code during transition)
        'obsidian-deep': '#060810',
        'glass-border': 'rgba(255, 255, 255, 0.06)',
        'glass-surface': 'rgba(13, 17, 32, 0.8)',
        'on-surface': '#c8cfe0',
        'on-surface-variant': '#6b7494',
        'surface-container': '#121826',
        'surface-container-high': '#1e2538',
        'outline-variant': 'rgba(255, 255, 255, 0.1)',
        'primary': '#d4aa64',
        'on-primary': '#0a0c12',
        'primary-container': '#b08f4e',
        'success-glow': '#34d399',
        'warning-glow': '#fbbf24',
        'danger-glow': '#f87171',
        'error': '#f87171',
        'error-container': 'rgba(239, 68, 68, 0.15)',
        'secondary': '#8b93a8',
        'secondary-container': 'rgba(139, 147, 168, 0.15)',
        'tertiary': '#a78bc4',
        'tertiary-container': 'rgba(167, 139, 196, 0.15)',
      },

      fontFamily: {
        'display': ['Sora', 'sans-serif'],
        'sans': ['DM Sans', 'sans-serif'],
        'mono': ['DM Mono', 'monospace'],
        // Legacy aliases
        'headline-lg': ['Sora', 'sans-serif'],
        'headline-md': ['Sora', 'sans-serif'],
        'label-md': ['DM Sans', 'sans-serif'],
        'label-sm': ['DM Mono', 'monospace'],
        'body-md': ['DM Sans', 'sans-serif'],
        'body-lg': ['DM Sans', 'sans-serif'],
      },

      fontSize: {
        'display-lg': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'headline-lg': ['clamp(1.4rem, 2.5vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['clamp(1.1rem, 1.8vw, 1.5rem)', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.65', fontWeight: '400' }],
        'body-md': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'label-md': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-sm': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.03em', fontWeight: '500' }],
      },

      borderRadius: {
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
        'full': '9999px',
      },

      spacing: {
        'margin-mobile': '1rem',
        'margin-desktop': '2.5rem',
        'stack-lg': '2rem',
        'stack-md': '1rem',
        'stack-sm': '0.5rem',
        'gutter': '1.5rem',
        'unit': '4px',
        'container-max': '1280px',
      },

      backdropBlur: {
        'xl': '20px',
      },

      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 2px 8px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3)',
        'amber': '0 4px 20px rgba(212, 170, 100, 0.2)',
        'amber-sm': '0 2px 8px rgba(212, 170, 100, 0.15)',
        // Legacy
        'primary-glow': '0 4px 20px rgba(212, 170, 100, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'qr-glow': '0 0 20px rgba(255, 255, 255, 0.08)',
        'success-glow': '0 0 15px rgba(52, 211, 153, 0.2)',
        'danger-glow': '0 0 15px rgba(248, 113, 113, 0.2)',
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};