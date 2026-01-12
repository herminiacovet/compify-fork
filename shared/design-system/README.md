# Compify Design System

A framework-agnostic design system ensuring consistent UI/UX across all Compify applications.

## Overview

This design system provides a unified visual language for:
- **Static Site** (Astro) - Marketing pages
- **Backend UI** (Go + Templ + HTMX) - Authentication and dashboard
- **Sandbox** (Static HTML/JS) - Game interfaces

## Architecture

The design system is built as CSS-only modules that can be imported by any framework:

```
shared/design-system/
├── tokens.css          # Design tokens (colors, spacing, typography)
├── base.css            # Reset and base styles
├── components.css      # Component styles (buttons, forms, cards)
├── layout.css          # Layout utilities (grids, containers)
├── utilities.css       # Utility classes
└── README.md           # This file
```

## Usage

### In Astro (Static Site)
```astro
---
// In Layout.astro
---
<link rel="stylesheet" href="/shared/design-system/tokens.css">
<link rel="stylesheet" href="/shared/design-system/base.css">
<link rel="stylesheet" href="/shared/design-system/components.css">
<link rel="stylesheet" href="/shared/design-system/layout.css">
```

### In Go Templates (Backend)
```html
<!-- In layout.templ -->
<link rel="stylesheet" href="/static/design-system/tokens.css">
<link rel="stylesheet" href="/static/design-system/base.css">
<link rel="stylesheet" href="/static/design-system/components.css">
<link rel="stylesheet" href="/static/design-system/layout.css">
```

### In Static HTML (Sandbox)
```html
<!-- In index.html -->
<link rel="stylesheet" href="../shared/design-system/tokens.css">
<link rel="stylesheet" href="../shared/design-system/base.css">
<link rel="stylesheet" href="../shared/design-system/components.css">
<link rel="stylesheet" href="../shared/design-system/layout.css">
```

## Design Tokens

### Colors
- **Primary**: Blue scale for main actions and branding
- **Secondary**: Gray scale for secondary actions
- **Success**: Green for positive feedback
- **Warning**: Yellow for caution states
- **Error**: Red for error states
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Font Stack**: System fonts for performance
- **Scale**: Modular scale (1.25 ratio)
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- **Base Unit**: 0.25rem (4px)
- **Scale**: 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6rem

### Breakpoints
- **Mobile**: 0-767px
- **Tablet**: 768-1023px
- **Desktop**: 1024px+

## Components

### Buttons
- `.btn` - Base button class
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.btn-outline` - Outline button
- `.btn-ghost` - Ghost button
- `.btn-sm`, `.btn-lg` - Size variants

### Forms
- `.form-group` - Form field container
- `.form-label` - Form labels
- `.form-input` - Text inputs
- `.form-select` - Select dropdowns
- `.form-textarea` - Textareas
- `.form-error` - Error states

### Cards
- `.card` - Base card component
- `.card-header` - Card header
- `.card-body` - Card content
- `.card-footer` - Card footer

### Navigation
- `.nav` - Base navigation
- `.nav-horizontal` - Horizontal navigation
- `.nav-vertical` - Vertical navigation
- `.nav-item` - Navigation items
- `.nav-link` - Navigation links

### Alerts
- `.alert` - Base alert
- `.alert-success` - Success message
- `.alert-warning` - Warning message
- `.alert-error` - Error message
- `.alert-info` - Info message

## Layout

### Containers
- `.container` - Max-width container with responsive padding
- `.container-fluid` - Full-width container
- `.container-sm`, `.container-md`, `.container-lg` - Size variants

### Grid System
- `.grid` - CSS Grid container
- `.grid-cols-{n}` - Grid columns (1-12)
- `.col-span-{n}` - Column span (1-12)
- `.gap-{size}` - Grid gap utilities

### Flexbox
- `.flex` - Flexbox container
- `.flex-col` - Flex column
- `.items-{alignment}` - Align items
- `.justify-{alignment}` - Justify content

## Utilities

### Spacing
- `.m-{size}` - Margin
- `.p-{size}` - Padding
- `.mt-{size}`, `.mr-{size}`, etc. - Directional spacing

### Typography
- `.text-{size}` - Font sizes
- `.font-{weight}` - Font weights
- `.text-{color}` - Text colors
- `.text-{alignment}` - Text alignment

### Display
- `.block`, `.inline`, `.flex`, `.grid` - Display utilities
- `.hidden` - Hide element
- `.sr-only` - Screen reader only

## Accessibility

The design system includes:
- High contrast ratios (WCAG AA compliant)
- Focus indicators for keyboard navigation
- Screen reader friendly markup
- Reduced motion support
- Semantic HTML structure

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Rules

1. **No app-specific styles** - All styling must come from the design system
2. **Extend, don't override** - Use CSS custom properties for customization
3. **Mobile-first** - All components are responsive by default
4. **Performance-first** - Minimal CSS, no JavaScript dependencies
5. **Accessibility-first** - All components meet WCAG AA standards

## Migration Guide

### From Current Styles

1. Replace inline styles with design system classes
2. Update color values to use CSS custom properties
3. Replace custom buttons with `.btn` classes
4. Update form styling to use `.form-*` classes
5. Replace custom containers with `.container` classes

### Testing

After migration, verify:
- Visual consistency across all apps
- Responsive behavior on all screen sizes
- Accessibility with screen readers
- Performance impact (should be minimal)

## Maintenance

- Design tokens are the single source of truth
- Component changes must be tested across all apps
- Breaking changes require version updates
- Documentation must be updated with changes