# Knowledge: Design System

We use a modern, beautiful styling system using Dart Sass and CSS variables:

- **Variables**: Located in `src/app/core/styles/_variables.scss`.
- **Mixins**: Located in `src/app/core/styles/_mixins.scss`.
- **Global badging / elements**: Avoid custom styles inside component SCSS files if base styles (like badges, skeleton structures) are defined globally.
- **Glassmorphism**: Use `@mixin glass-panel` to format consistent layout panels.
- **Themes & Gradients**: Use category-specific gradients (e.g. `var(--grammar-gradient)`) and theme custom properties (`var(--primary)`, etc.) to facilitate dark mode compatibility.
- **Rules**:
  - Always put `@use` lines at the very top of `.scss` stylesheets before any rules/variables.
