# Gemini Workspace Guidelines

Guidelines for Gemini models working on the TOEIC Practice project.

---

## 1. Stack & Standards

- **Core**: Angular 22+ (Standalone components, Zoneless Change Detection).
- **State & Binding**: Signals (`signal`, `computed`, `input`, `output`), and `resource()` API for async loading.
- **UI & Presentation**: Custom responsive templates and styles. Dart Sass modular styles with `@use`. Avoid duplication of base styles.

## 2. Validation & Quality Checklist

Ensure quality checks are performed as follows:

1. **Lint & Format**: Run `npx prettier --write "src/**/*.{ts,html,scss}"` immediately after making code changes (via `post-code-change` hook).
2. **Dedicated Unit Tests**: Write and execute dedicated unit tests using Vitest (`npx vitest run`) for any modified logic (Validation Phase).
3. **Build**: Run `npm run build` or `npx ng build` to verify zero build and compilation errors (Validation Phase).
4. **Visual Check**: Run `npm start` and manually inspect the responsive layout and browser logs (Validation Phase).

## 3. Workflow Reference & Strict Compliance

- Always refer to [.agents/AGENTS.md](file:///Users/nguyenson/Github/toeic/.agents/AGENTS.md) for the main orchestration workflow.
- **CRITICAL COMPLIANCE RULE**: You MUST NOT skip any phases defined in the loaded workflow (e.g., `.agents/workflows/*.md`). You MUST execute them strictly and sequentially. Creating an explicit task checklist (Task Tracker) to track your progress across these phases is MANDATORY.

## 4. Context & Search Exclusions

- **Strict Ignored Folders**: When executing searches (via `grep_search`, `list_dir`, or shell commands like `find`, `grep`, `ls`), you MUST strictly respect ignore configurations.
- **Excluded Targets**: Absolutely DO NOT search, read, or process files located in folders specified in `.gitignore` and `.aiexclude` (such as `dist/`, `node_modules/`, `.git/`, `.agents/`) unless the user explicitly requests you to inspect a specific excluded path in their prompt.
- **Strict Command Exclusions**: When executing search commands in the shell, you MUST explicitly exclude folders like `dist/`, `node_modules/`, `.git/`, and `.agents/`.
