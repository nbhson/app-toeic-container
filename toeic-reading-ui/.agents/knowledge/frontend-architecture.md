# Knowledge: Frontend Architecture

We use the latest features in Angular 22+ to ensure high performance and modern code practices:

- **Core Framework**: Angular 22+.
- **Zoneless Change Detection**: Always use `provideZonelessChangeDetection()` in the application config. Ensure all components use `changeDetection: ChangeDetectionStrategy.OnPush`.
- **Signals State Management**:
  - Use Signals (`signal`) for writable state.
  - Use Computed Signals (`computed`) for read-only derived values.
  - Use `effect` only when doing side-effects (e.g., synchronizing storage or resetting state on signal changes). Wrap any untracked reads inside `untracked()`.
- **Modern Signal Inputs & Outputs**:
  - Use signal-based inputs: `myInput = input<type>()` or `requiredInput = input.required<type>()`.
  - Use signal-based outputs: `myOutput = output<type>()`.
- **Declarative Data Loading**:
  - Use the new `resource()` API for asynchronous requests and fetching data.
  - Utilize `resource.isLoading` and `resource.error` inside templates to handle loading and error states cleanly.
- **Modern Control Flow**:
  - Always use `@if`, `@else`, `@for` (with `track` parameter), and `@switch` syntax.
  - Avoid importing `CommonModule` (`ngIf`, `ngFor`, etc.) in Standalone component imports.
- **Lazy Loading**:
  - Lazy-load route definitions inside [app.routes.ts](file:///Users/nguyenson/Github/toeic/src/app/core/routers/app.routes.ts) using `loadComponent`.
  - Use `@defer` (e.g., `(on interaction)`) to lazy-load non-critical child views like settings modals.
- **Styling**: Dart Sass namespace imports (`@use`), utility classes, and global variables/mixins.
- **Testing**: Vitest (`npx vitest`).
- **Formatting**: Prettier (`npx prettier`).

---

## Architectural Pattern & Directory Structure

### 1. Component Decomposition
We separate responsibilities cleanly using container and presenter components:

- **Container/Orchestrator Components** (Parent):
  - Responsible for fetching data (using `resource()`), managing routing, submission handlers, and route transition guards (`canDeactivate`).
- **Stateless Presenter Components** (Children):
  - Located under the `components/` subfolder.
  - Accept inputs via Signal inputs (`input<type>()`) and emit actions via outputs (`output<type>()`).
  - Purely presentational and state-free.

### 2. Symmetrical Refactoring
Maintain strict symmetry between similar domains (e.g. `practice-part5` and `practice-part6` have parallel folder structures and route guard patterns).

### 3. Core Assets Organization
- **Routes**: Keep routing configurations inside `src/app/core/routers/`.
- **Global Styles**: Keep style entrypoint and partials inside `src/app/core/styles/`.
- **Models**: Keep interfaces inside `src/app/core/models/toeic.model.ts`.
- **Services**: Keep services inside `src/app/core/services/`.
