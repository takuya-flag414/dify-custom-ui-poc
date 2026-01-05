export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--bg-base)',
          'layer-1': 'var(--bg-layer-1)',
          'layer-2': 'var(--bg-layer-2)',
          // Legacy aliases
          layer1: 'var(--bg-layer-1)',
          surface: 'var(--bg-layer-2)',
          sidebar: 'var(--bg-layer-1)',
        },
        text: {
          main: 'var(--color-text-main)',
          sub: 'var(--color-text-sub)',
          muted: 'var(--color-text-muted)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          bg: 'var(--color-primary-bg)',
          'bg-hover': 'var(--color-primary-bg-hover)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        error: 'var(--color-error)',
        success: 'var(--color-success)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        // Admin Scale (High Density) - DESIGN_RULE.md 4.2
        'admin-label': ['11px', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '600' }],
        'admin-body':  ['13px', { lineHeight: '16px' }],
        // Chat Scale (Conversational) - DESIGN_RULE.md 4.1
        'chat-body':   ['17px', { lineHeight: '1.5' }],
        'chat-title':  ['22px', { lineHeight: '1.3', fontWeight: '700' }],
        // Legacy aliases
        xs: ['11px', '1.4'],
        sm: ['12px', '1.5'],
        base: ['14px', '1.5'],
        lg: ['16px', '1.5'],
        xl: ['18px', '1.3'],
        '2xl': ['22px', '1.2'],
        '3xl': ['28px', '1.2'],
      },
      borderRadius: {
        'xl': '10px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        'capsule': '9999px',
      },
      backdropBlur: {
        'macos': '20px',
      },
      backdropSaturate: {
        'vibrant': '180%',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      letterSpacing: {
        tight: '-0.022em',
        normal: '-0.01em',
        wide: '0.01em',
      }
    },
  },
  plugins: [],
}
