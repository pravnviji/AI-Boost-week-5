# How to Add a Cursor Rule

## When to use

Add a rule when you want AI to follow a convention every time it works in a specific area of the codebase.

## Steps

### 1. Create the file

```bash
touch .cursor/rules/my-rule.mdc
```

### 2. Add frontmatter

```yaml
---
description: Short description of what this rule enforces
globs: src/api/**          # Optional: only apply to matching files
alwaysApply: false          # true = always on, false = only when matching globs
---
```

### 3. Write the rule body

Use markdown. Be specific and actionable:
- State conventions clearly
- Show code examples of correct patterns
- List common mistakes to avoid

### 4. Test it

Open a file matching your glob pattern in Cursor. Start a chat — the AI should follow your rule automatically.

## Examples

See existing rules in `.cursor/rules/`:
- `general-rule.mdc` — project-wide conventions
- `backend.mdc` — FastAPI-specific patterns
- `frontend.mdc` — Angular conventions
