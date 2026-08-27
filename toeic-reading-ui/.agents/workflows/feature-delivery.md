# Workflow: Feature Delivery

Workflow for delivering new features in the TOEIC application, aligned with architectural and styling standards.

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

You MUST NOT immediately start implementation. Always follow these sequential steps for feature delivery:

### Step 1 — Load Knowledge
- Load **all** files under `.agents/knowledge/` to gain a comprehensive understanding of project features, architectural structures, and business rules.

### Step 2 — Apply Rules
- Enforce rules based on the **Rules Mapping by Scope** table above.

### Step 3 — Discovery Phase
- Load module guidelines, review local Angular layout structures, and align on boundaries.
- Search core directories (`src/app/core/constants/`, `src/app/core/services/`, etc.) for any pre-existing constants, helper utilities, or schemas related to the task.
- _Do NOT modify source code during this phase._

### Step 4 — Planning Phase
- Create an `implementation_plan.md` artifact using `.agents/templates/technical-design-template.md`.
- Incorporate proposed changes and the verification plan.

### Step 5 — Approval Gate
- Present the `implementation_plan.md` to the user and wait for explicit approval.
- _Do NOT write implementation code until approved._

### Step 6 — Implementation Phase
- Build standalone components using signals, SCSS mixins/variables, and modern Angular template control flow.
- Integrate state logic using Signal inputs/outputs, Angular services, and the `resource()` API.
- Keep changes minimal and follow project standards.
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
