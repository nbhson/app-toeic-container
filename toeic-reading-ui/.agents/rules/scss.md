# SCSS Styling Rules & Standards

This document outlines the styling standards for SCSS files in this repository.

## 1. Modular SCSS

- Split global styles into partials inside `src/app/core/styles/`.
- Import core variables and mixins using `@use` instead of `@import`.
- Relative paths should be used to refer to core styles:
  ```scss
  @use '../../../../core/styles/variables' as v;
  @use '../../../../core/styles/mixins' as *;
  ```

## 2. Order of `@use` rules

- All `@use` lines must appear at the absolute top of the stylesheet.
- No CSS properties, selectors, or variables can be declared before any `@use` statements.

## 3. Mixins and CSS Variables

- Use `@mixin glass-panel` for glassmorphic elements to ensure consistency.
- Use `@mixin btn-base` or `@mixin btn-theme` for standardizing buttons.
- Avoid hardcoded hex color values; use theme custom properties (`var(--primary)`, `var(--success)`, etc.) or gradients (`var(--grammar-gradient)`).
- Do not duplicate badge base styles inside component-level styles. Use global `.badge` or `.badge-*` classes instead.
