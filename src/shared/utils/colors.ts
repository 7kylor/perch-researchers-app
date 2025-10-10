import { COLORS, CSS_COLOR_VARS } from '../constants/colors.js';

/**
 * Color utility functions for consistent color usage across the application
 */

/**
 * Get a color value by key
 */
export function getColor(key: keyof typeof COLORS): string {
  const colorValue = COLORS[key];
  return typeof colorValue === 'string' ? colorValue : COLORS.PRIMARY;
}

/**
 * Get a gray scale color by scale value
 */
export function getGrayColor(scale: keyof typeof COLORS.GRAY): string {
  return COLORS.GRAY[scale];
}

/**
 * Get CSS custom property value for theme-aware colors
 */
export function getCSSVar(varName: keyof typeof CSS_COLOR_VARS): string {
  if (typeof window !== 'undefined') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(
      CSS_COLOR_VARS[varName],
    );
    return value.trim() || COLORS.PRIMARY; // fallback to primary if not found
  }
  return COLORS.PRIMARY;
}

/**
 * Get color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // If it's already a CSS custom property, return as-is for theme system to handle
  if (color.startsWith('--')) {
    return color;
  }

  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate color variations for hover states, etc.
 */
export function generateColorVariations(baseColor: string): {
  light: string;
  dark: string;
  hover: string;
  focus: string;
} {
  // This is a simple implementation - in a real app you might use a color manipulation library
  return {
    light: withOpacity(baseColor, 0.1),
    dark: withOpacity(baseColor, 0.8),
    hover: withOpacity(baseColor, 0.9),
    focus: withOpacity(baseColor, 0.95),
  };
}
