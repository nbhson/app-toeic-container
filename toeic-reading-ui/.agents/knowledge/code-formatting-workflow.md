# Hook: Post Code Change

Triggered automatically after any source code files are modified to ensure code hygiene in the TOEIC application.

---

## Instructions

1. **Lint & Format**: Run `npx prettier --write "src/**/*.{ts,html,scss}"` (and `.agents/**/*.{md,json}` if applicable) to clean and format the code.
2. **Security**: Ensure no sensitive configuration, credentials, API keys, or secrets are added to the codebase.
