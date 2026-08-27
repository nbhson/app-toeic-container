#!/bin/bash

echo "Running Pre-Commit Verification Hook..."

# Run prettier on staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|html|scss)$' || true)

if [ -n "$STAGED_FILES" ]; then
    echo "Formatting staged files with Prettier..."
    echo "$STAGED_FILES" | xargs npx prettier --write
    # Add formatted files back to stage
    echo "$STAGED_FILES" | xargs git add
fi

# Run vitest unit tests
echo "Running Vitest unit tests..."
npx vitest run

# Check if tests passed
if [ $? -ne 0 ]; then
    echo "ERROR: Unit tests failed. Commit aborted."
    exit 1
fi

echo "Pre-commit verification successful!"
exit 0
