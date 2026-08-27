# Rule: Coding Style & Code Reuse

This document enforces rules for code reuse, formatting, and cleanliness across the TOEIC application.

---

## 1. Core Asset Reuse (CRITICAL)

Before defining any new constants, typescript models, utility functions, or services, agents **MUST** search the `src/app/core/` directory to see if they are already defined:

- **Constants**: Check [app.constants.ts](file:///Users/nguyenson/Github/toeic/src/app/core/constants/app.constants.ts) or feature-specific mock files before creating new config variables, API routes, or mock questions.
- **Models/Types**: Re-use interfaces defined in [toeic.model.ts](file:///Users/nguyenson/Github/toeic/src/app/core/models/toeic.model.ts) instead of declaring duplicate inline types.
- **Services**: Reuse core services (e.g., state controllers, storage synchronizers) instead of rewriting logic.

## 2. SCSS Styles & Variables Reuse

- **Variables**: Always use variables from `src/app/core/styles/_variables.scss` (`var(--primary)`, `var(--grammar-gradient)`, etc.) instead of hardcoded hex colors.
- **Mixins**: Reuse mixins from `src/app/core/styles/_mixins.scss` (such as `@mixin glass-panel` or `@mixin btn-theme`).
- **Global Badges**: Do not duplicate badge layout structures; use standard global classes.

## 3. Code Cleanliness

- **No Duplication**: Do not copy-paste code snippets; refactor shared logic into helper utilities or services under `/core` or feature-specific components.
- **Unused Declarations**: Safely remove unused imports, variables, types, or methods immediately after completing changes.
- **Type Safety**: Strictly avoid using `any` types; define explicit typings or interfaces.

## 4. Safety & Interaction Rules

- **Confirmation Route Interceptions**:
  - For routes with practice progress, apply `canDeactivate: [pendingChangesGuard]` to prevent accidental routing.
  - Components with unsaved progress must implement a custom confirmation Modal (e.g. `ConfirmModalComponent`) and route interceptor (`confirmLeave()`) returning a `Promise<boolean>` for seamless async routing transitions.
