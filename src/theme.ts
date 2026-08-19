/**
 * Design tokens and theme constants for FirstClass OS.
 * Idiomatic Tailwind 4 color mappings, status palettes, and geometry rules.
 */

export const theme = {
  colors: {
    accent: {
      primary: '#f59e0b', // Amber 500
      light: '#fef3c7', // Amber 100
      dark: '#b45309', // Amber 700
      subtle: '#fffbeb', // Amber 50
    },
    neutral: {
      canvas: '#f8fafc', // Slate 50
      card: '#ffffff', // Clean white
      cardMuted: '#f1f5f9', // Slate 100
      border: '#e2e8f0', // Slate 200
      borderSubtle: '#f1f5f9', // Slate 100
      textPrimary: '#0f172a', // Slate 900
      textSecondary: '#475569', // Slate 600
      textMuted: '#94a3b8', // Slate 400
    },
    status: {
      stable: {
        text: '#059669', // Emerald 600
        bg: '#ecfdf5', // Emerald 50
        border: '#a7f3d0', // Emerald 200
        dot: '#10b981', // Emerald 500
      },
      optimal: {
        text: '#0284c7', // Sky 600
        bg: '#f0f9ff', // Sky 50
        border: '#bae6fd', // Sky 200
        dot: '#0ea5e9', // Sky 500
      },
      high: {
        text: '#d97706', // Amber 600
        bg: '#fffbeb', // Amber 50
        border: '#fde68a', // Amber 200
        dot: '#f59e0b', // Amber 500
      },
      critical: {
        text: '#e11d48', // Rose 600
        bg: '#fff1f2', // Rose 50
        border: '#fecdd3', // Rose 200
        dot: '#f43f5e', // Rose 500
      },
    },
  },
  radius: {
    card: 'rounded-2xl',
    inner: 'rounded-xl',
    button: 'rounded-xl',
    pill: 'rounded-full',
  },
  shadows: {
    card: 'shadow-2xs',
    cardHover: 'shadow-xs',
    elevated: 'shadow-md',
    dropdown: 'shadow-xl',
  },
} as const;

export type ThemeColors = typeof theme.colors;
