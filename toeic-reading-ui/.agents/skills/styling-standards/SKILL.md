---
name: styling-standards
description: Guides writing, refactoring, and maintaining SCSS files, modular stylesheets, using global themes, variables, mixins, and loops in the TOEIC workspace.
---

# SCSS Styling Standards & Refactoring

This skill enforces strict Sass styling practices to maintain high performance, small stylesheets, and DRY rules.

## 1. Modular SCSS Structure

We split global styles into partials inside `src/app/core/styles/`:

- `_variables.scss`: Global styling constants.
- `_mixins.scss`: Common mixins (e.g., `glass-panel`, `btn-base`).
- `_theme.scss`: Light and dark mode tokens using CSS custom properties.
- `_reset.scss`: Reset rules and scrollbars.
- `_layout.scss`: Common grid alignments and card structures.
- `_badges.scss`: Badge loop generators.
- `_shimmer.scss`: Skeleton loading shimmers.

## 2. Component SCSS Rules

1. **Relative Imports**:
   Always import design system variables and mixins using `@use`:
   ```scss
   @use '../../../../core/styles/variables' as v;
   @use '../../../../core/styles/mixins' as *;
   ```
2. **Order of `@use`**:
   All `@use` lines MUST be at the very top of the stylesheet.
3. **No Duplication**:
   - Do not define `.badge` or duplicate skeleton loading animation keyframes inside component-level styles. Refer to the global classes instead.
   - For custom badges, bind CSS variables using theme custom properties:
     ```scss
     .my-badge {
       background-color: var(--badge-mytype-bg);
       color: var(--badge-mytype-text);
     }
     ```

## 3. Responsive Breakpoints

Use variables or CSS grid layouts for responsive behavior:

```scss
.practice-main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
}
```

For sticky positioning, make sure sidebar/left column behaves static on smaller displays:

```scss
.passage-column {
  position: sticky;
  top: 2rem;

  @media (max-width: 992px) {
    position: static;
  }
}
```
