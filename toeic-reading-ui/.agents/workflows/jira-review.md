# Workflow: Jira Ticket Review

Systematic flow for retrieving and reviewing ticket details from Jira, assessing requirements, mapping technical impacts, and recommending downstream development or review workflows in the TOEIC application.

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

You MUST NOT immediately start implementation. Always follow these sequential steps for Jira ticket reviews:

### Step 1 — Load Knowledge
- Load `.agents/knowledge/project-overview.md`, `.agents/knowledge/module-map.md`, and `.agents/knowledge/frontend-architecture.md` to understand high-level project goals, module structure, and architecture for initial scoping.

### Step 2 — Apply Rules
- Enforce rules based on the **Rules Mapping by Scope** table above.

### Step 3 — Retrieve & Analyze Phase
- Use the `jira-mcp-community` tools (specifically `get_ticket_details` using the Ticket Key/ID) if available to retrieve the ticket summary, description, assignee, priority, acceptance criteria, components, parent tasks, and sub-tasks.
- Parse and analyze the requirements described. Document explicit and implicit acceptance criteria that must be satisfied.
- _Do NOT modify source code during this phase._

### Step 4 — Planning Phase
- Cross-reference the ticket requirements with codebase searches to identify which pages, routes, services, or models will be affected.
- Create and document the review findings using the `.agents/templates/jira-ticket-review-template.md` template.
- Classify the request based on the ticket's nature and recommend transitioning to one of the following downstream workflows: `feature-delivery`, `bug-fix`, `refactor`, or `code-review`.

### Step 5 — Approval Gate
- Present the Jira Ticket Review report to the developer.
- Once the workflow and initial impact assessment are approved, transition to the recommended workflow.
- _Note: This workflow is review-only. No codebase modifications or automated hooks are executed._
