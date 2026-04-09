# How to Add a Cursor Skill

## When to use

Add a skill when you want AI to have a **repeatable workflow** it can execute on demand — like code review, domain planning, or test generation.

## Steps

### 1. Create the folder

```bash
mkdir .cursor/skills/my-skill
```

### 2. Create SKILL.md

```bash
touch .cursor/skills/my-skill/SKILL.md
```

### 3. Structure the skill

```yaml
---
description: One-line description of what this skill does and when to use it
---
```

Then write the skill body:
- **Trigger phrases** — what the user says to activate it
- **Step-by-step workflow** — numbered steps the AI follows
- **Output format** — what the AI produces at the end
- **Core principles** — constraints and quality standards

### 4. Add reference files (optional)

If the skill needs domain knowledge, add a `reference.md` alongside `SKILL.md`.

## Examples

- `code-review/SKILL.md` — structured diff review with severity levels
- `domain-expert/SKILL.md` — business validation with planning and validation modes
