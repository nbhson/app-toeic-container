# Hook: Pre Pull Request (Pre-PR)

Triggered before submitting code for review.

---

## Instructions

1. **Confirm Validation**: Ensure all code quality checks (prettier format) and validation checks (Vitest unit tests, build checks, and manual dev server checks) have passed successfully.
2. **Review Checklist**: Verify standard features use Angular 22+ Standalone components, Signals, `resource()` API, and SCSS variables/mixins.
3. **PR details**: Fill out Pull Request details using `.agents/templates/pull-request-template.md`.
4. **Automated GitHub PR Creation**:
   - Check out a descriptive branch (e.g., `feat/feature-name` or `fix/bug-name`).
   - Stage and commit all verified changes. The commit message **should** be descriptive (e.g., `feat: add confirm modal for unsaved practice progress`).
   - Push the branch to the GitHub remote.
   - Propose or help the user open a Pull Request to the main branch.
   - Include the Pull Request link in the final Engineering Report.
