# Knowledge: Module Map

The codebase layout is structured as follows:

- `src/app/core/`: Application-wide core configurations.
  - `routers/app.routes.ts`: Central routing using `loadComponent` for lazy loading.
  - `styles/`: Stylesheets, including global styles and Sass partials (`_variables.scss`, `_mixins.scss`).
  - `models/toeic.model.ts`: Data models and TypeScript interfaces.
  - `services/`: Global services and state controllers.
  - `constants/app.constants.ts`: Global application constants.
- `src/app/features/`: Feature modules.
  - Symmetrical domains like `practice-part5` and `practice-part6` have parallel folder structures.
  - Focused presenters are nested in a `components/` subdirectory under the feature.
