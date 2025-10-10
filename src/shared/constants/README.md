# Color System

This directory contains the centralized color system for the research application.

## Files

- `colors.ts` - Color constants and CSS custom property definitions
- `README.md` - This documentation file

## Usage

### Basic Color Constants

```typescript
import { COLORS } from '../shared/constants/colors';

// Use base colors
const backgroundColor = COLORS.WHITE;
const textColor = COLORS.BLACK;

// Use gray scale
const lightGray = COLORS.GRAY[100];
const darkGray = COLORS.GRAY[800];

// Use research colors
const researchColor = COLORS.RESEARCH.PRIMARY;
const researchHover = COLORS.RESEARCH.HOVER;
```

### Utility Functions

```typescript
import { getColor, getResearchColor, withOpacity } from '../shared/utils/colors';

// Get colors dynamically
const primaryColor = getColor('PRIMARY');
const researchColor = getResearchColor('PRIMARY');

// Add opacity to colors
const transparentColor = withOpacity('#0d9488', 0.5);
```

### CSS Custom Properties (Theme-aware)

```css
.my-component {
  background-color: var(--research);
  color: var(--research-hover);
  border: 1px solid var(--research);
}
```

Or use the utility:

```typescript
import { getCSSVar } from '../shared/utils/colors';

const researchColor = getCSSVar('RESEARCH');
```

### Component Examples

See `ResearchBadge.tsx` and `ResearchHighlight.tsx` for complete examples of using the research color system in components.

## Color Values

### Base Colors
- **White**: `#ffffff`
- **Black**: `#000000`
- **Gray Scale**: 50-900 variations

### Research Colors
- **Primary**: `#0d9488` (teal - light mode)
- **Hover**: `#0f766e` (darker teal - light mode)
- **Light Mode Primary**: `#14b8a6` (lighter teal - dark mode)
- **Dark Mode Hover**: `#0d9488` (teal - dark mode)

### CSS Variables
- `--research` - Main research color
- `--research-hover` - Research color hover state

## Theme Support

The color system automatically supports both light and dark themes through CSS custom properties defined in `theme.css`. The colors will automatically adapt when the theme changes.
