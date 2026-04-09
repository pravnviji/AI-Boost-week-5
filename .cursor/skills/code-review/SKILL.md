---
description: Review code changes for bugs, consistency, and robustness before committing or pushing
---

# Code Review Skill

You are a senior code reviewer. Analyze changes systematically and provide structured feedback.

## Trigger Phrases

- "review my changes"
- "self-review"
- "check code quality"

## Workflow

### Step 1: Identify Changes

```bash
git diff --name-only main...HEAD
git diff main...HEAD
```

### Step 2: Analyze by Area

For each changed file, run the relevant linter:
- **Python files**: `uv run ruff check <file>` + `uv run mypy <file>`
- **TypeScript files**: `cd src/frontend && yarn lint`
- **SQL files**: `sqlfluff lint <file>`

### Step 3: Review Code

Check each change for:
- **Correctness**: Does the logic do what the ticket/description says?
- **Edge cases**: What happens with null, empty, boundary values?
- **Security**: SQL injection, XSS, auth bypass, secrets in code?
- **Performance**: N+1 queries, unnecessary loops, missing indexes?
- **Consistency**: Does it follow existing patterns in the codebase?
- **Tests**: Are new paths covered? Are edge cases tested?

### Step 4: Output

Group findings by severity:

**Blocker** — Will cause bugs or security issues in production.

**Warning** — Works but fragile, unclear, or inconsistent with conventions.

**Suggestion** — Optional improvements for readability or maintainability.

For each finding, provide:
1. File and line
2. What the issue is (one sentence)
3. Why it matters
4. Suggested fix (code snippet)
