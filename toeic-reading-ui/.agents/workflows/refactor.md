# Workflow: Refactor

Workflow for improving codebase structure, style, or performance without breaking features in the TOEIC application.

---

## 1. Rules Mapping by Scope

Always apply the following coding guidelines. Load additional rules based on the components touched:

| **Scope / Component**               | **Rules to Load** | **Why to Load / Description**                                                                              |
| ----------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **All Workflows / Modifications**   | `coding-style.md` | Enforces code reuse, check `/core` assets (constants, styles, models) before coding, and types safety.     |
| **Routing & Folder Structure**      | `angular.md`      | Enforces Angular components structure, file suffixes, and lazy loading configuration.                      |
| **Component Logic & Signals**       | `angular.md`      | Minimizes reactivity overhead, enforces modern signals, input/output APIs, and `resource()` data fetching. |
| **Styling, Layout, Responsiveness** | `scss.md`         | Enforces SCSS imports conventions, mixins, glass panels, and prevents styling duplication.                 |
| **Documentation & Reports**         | `templates.md`    | Dictates which markdown templates to use for Jira reviews, bug reports, and pull requests.                 |

## 2. Orchestration Workflow

You MUST NOT immediately start implementation. Always follow these sequential steps for refactoring:

### Step 1 — Load Knowledge
- Load `.agents/knowledge/module-map.md`, `.agents/knowledge/frontend-architecture.md`, and `.agents/knowledge/design-system.md` to ensure structural changes align with module boundaries, architectural principles, and current design system tokens.

### Step 2 — Apply Rules
- Enforce rules based on the **Rules Mapping by Scope** table above.

### Step 3 — Smell Assessment
- Identify candidates (such as complex components that should be decomposed into presenter children, direct DOM manipulations, missing `OnPush` detection, duplicate SCSS/CSS declarations, or non-signal inputs/outputs).
- _Do NOT modify source code during this phase._

### Step 4 — Planning Phase
- Outline refactoring changes in `implementation_plan.md` using `.agents/templates/technical-design-template.md`.

### Step 5 — Approval Gate
- Present the `implementation_plan.md` to the user and wait for explicit approval.
- _Do NOT write implementation code until approved._

### Step 6 — Implementation Phase
- Make modular edits to maintain overall stability and avoid large, sweeping refactoring sets.
- Run code formatting workflow: `.agents/knowledge/code-formatting-workflow.md` immediately after code changes.

### Step 7 — Validation Phase
- **Automated Tests**: Write and execute dedicated unit tests using Vitest (`npx vitest run`).
- **Build Check**: Run `npm run build` or `npx ng build`.
- **Visual Check**: Run `npm start` and manually inspect the responsive layout and browser logs.
- _Return to the Implementation Phase if any check fails._

### Step 8 — Engineering Report
- Provide the engineering report using `.agents/templates/engineering-report-template.md`.

### Step 9 — Pre PR Review
- Run PR creation workflow (`.agents/knowledge/pr-creation-workflow.md`) to commit, push, and describe the Pull Request on GitHub.
