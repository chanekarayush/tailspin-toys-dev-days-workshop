---
description: 'Tailwind CSS v4 styling patterns and dark theme guidelines'
applyTo: '**/*.{astro,css}'
---

# Tailwind CSS Instructions

## Tailwind CSS v4 Configuration

This project uses Tailwind CSS v4.1.14 via the `@tailwindcss/vite` plugin.

### Global CSS Setup

- Import Tailwind in `global.css`: `@import "tailwindcss";`
- No separate `tailwind.config.js` file is used
- Configuration is handled through the Vite plugin

## Theme Styling

The application defaults to a GitHub-inspired dark theme and supports an accessible light
theme through the `html.light` class. Shared semantic tokens are defined in
`src/styles/global.css` and should be preferred over hard-coded palette utilities:

- Surfaces: `--color-bg`, `--color-surface`, `--color-surface-muted`
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- Borders: `--color-border-default`, `--color-border-subtle`
- Interaction: `--color-link`, `--color-accent`, `--color-accent-hover`, `--color-focus`
- Status: `--color-success-*`, `--color-warning-*`, and `--color-danger-*`

Use the `theme-panel`, `theme-panel-subtle`, `theme-heading`, `theme-copy`, and
`theme-copy-muted` utility classes for shared content surfaces and typography. Status
messages must include text or an icon/label in addition to color so meaning is never
communicated by hue alone. Keep contrast at WCAG 2.1 AA levels in both modes.

### Common Patterns

- Cards and containers: `bg-slate-800 rounded-xl p-6 shadow-lg`
- Hover effects: `hover:bg-slate-700 transition-colors duration-200`
- Borders: `border border-slate-700`
- Gradients for visual interest: `bg-gradient-to-br from-slate-800 to-slate-900`
- Backdrop effects: `backdrop-blur-sm bg-slate-900/50`

### Responsive Design

- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Mobile-first approach
- Ensure readability on all screen sizes

## Utility Classes

- Prefer utility classes over custom CSS when possible
- Use semantic grouping: layout, spacing, colors, typography
- Keep utility combinations readable and maintainable

## Commenting and TypeScript formatting

- Comment the decision or constraint, not the implementation detail that is already obvious from the code.
- Prefer concise, intentional comments and delete anything that restates the surrounding code.
- TypeScript formatting should stay consistent with the repository: 2-space indentation, semicolons, trailing commas in multiline objects/arrays, and quoted string literals using single quotes unless the surrounding code clearly uses a different convention.
- For exported TypeScript functions in `db/` and `src/lib/`, include an explicit return type and a JSDoc description that names the behavior, important parameters, and output.
- Keep comments current when logic changes; outdated comments are treated like broken documentation.

> [!NOTE]
> ESLint currently enforces the repo’s TypeScript safety defaults (`no-unused-vars`, recommended TS rules), and we keep the style rules small and predictable so they don’t fight the app’s existing patterns.

## Modern UI Patterns

- Rounded corners: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Smooth transitions: `transition-all duration-200 ease-in-out`
- Shadows for depth: `shadow-md`, `shadow-lg`, `shadow-xl`
- Focus states for accessibility: `focus:ring-2 focus:ring-blue-500`
