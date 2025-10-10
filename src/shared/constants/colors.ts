/**
 * Color constants for the research application
 * Provides a centralized color system for consistent UI theming
 * Uses only white, gray, and black colors for text consistency
 */

// Core colors - Only white, gray, black
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

  // Status colors - Using gray scale only
  SUCCESS: '#059669',
  WARNING: '#d97706',
  ERROR: '#dc2626',

  // Primary colors - Using gray scale
  PRIMARY: '#374151',
  PRIMARY_HOVER: '#1f2937',
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
  SUCCESS: '--success',
  WARNING: '--warning',
  ERROR: '--error',
  BORDER: '--border',
} as const;

// Type-safe color keys
export type ColorKey = keyof typeof COLORS;
export type GrayScaleKey = keyof typeof COLORS.GRAY;
