/**
 * Color constants for the research application
 * Provides a centralized color system for consistent UI theming
 */

// Core colors
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

  // Research-specific colors
  RESEARCH: {
    PRIMARY: '#0d9488',
    HOVER: '#0f766e',
    LIGHT: '#14b8a6',
    DARK: '#0d9488',
  },

  // Status colors
  SUCCESS: '#1a7f37',
  WARNING: '#d4a72c',
  ERROR: '#cf222e',

  // Primary colors
  PRIMARY: '#0969da',
  PRIMARY_HOVER: '#0550ae',
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
  RESEARCH: '--research',
  RESEARCH_HOVER: '--research-hover',
  SUCCESS: '--success',
  WARNING: '--warning',
  ERROR: '--error',
  BORDER: '--border',
} as const;

// Type-safe color keys
export type ColorKey = keyof typeof COLORS;
export type ResearchColorKey = keyof typeof COLORS.RESEARCH;
export type GrayScaleKey = keyof typeof COLORS.GRAY;
