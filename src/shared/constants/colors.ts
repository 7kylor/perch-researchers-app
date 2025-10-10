/**
 * Color constants for the research application
 * Provides a centralized color system for consistent UI theming
 */

// Core colors - Unified design system
export const COLORS = {
  // Base colors
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Primary teal color scheme (0d9488)
  PRIMARY: '#0d9488',
  PRIMARY_HOVER: '#0f766e',
  PRIMARY_LIGHT: '#14b8a6',
  PRIMARY_DARK: '#0d9488',

  // Secondary colors for accents
  SECONDARY: '#059669',
  SECONDARY_HOVER: '#047857',
  SECONDARY_LIGHT: '#10b981',

  // Status colors
  SUCCESS: '#059669',
  SUCCESS_HOVER: '#047857',
  SUCCESS_LIGHT: '#10b981',
  WARNING: '#d97706',
  WARNING_HOVER: '#b45309',
  WARNING_LIGHT: '#f59e0b',
  ERROR: '#dc2626',
  ERROR_HOVER: '#b91c1c',
  ERROR_LIGHT: '#ef4444',

  // Legacy colors (keeping for backward compatibility)
  RESEARCH: {
    PRIMARY: '#0d9488',
    HOVER: '#0f766e',
    LIGHT: '#14b8a6',
    DARK: '#0d9488',
  },
} as const;

// CSS custom property names for theme integration
export const CSS_COLOR_VARS = {
  BG: '--bg',
  SURFACE: '--surface',
  TEXT: '--text',
  TEXT_SECONDARY: '--text-secondary',
  MUTED: '--muted',
  PRIMARY: '--primary',
  PRIMARY_HOVER: '--primary-hover',
  PRIMARY_LIGHT: '--primary-light',
  SECONDARY: '--secondary',
  SECONDARY_HOVER: '--secondary-hover',
  SUCCESS: '--success',
  SUCCESS_HOVER: '--success-hover',
  SUCCESS_LIGHT: '--success-light',
  WARNING: '--warning',
  WARNING_HOVER: '--warning-hover',
  WARNING_LIGHT: '--warning-light',
  ERROR: '--error',
  ERROR_HOVER: '--error-hover',
  ERROR_LIGHT: '--error-light',
  BORDER: '--border',
  // Legacy support
  RESEARCH: '--primary',
  RESEARCH_HOVER: '--primary-hover',
} as const;

// Type-safe color keys
export type ColorKey = keyof typeof COLORS;
export type ResearchColorKey = keyof typeof COLORS.RESEARCH;
export type GrayScaleKey = keyof typeof COLORS.GRAY;
