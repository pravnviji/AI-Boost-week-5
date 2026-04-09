---
description: Create a JIRA issue with structured body and acceptance criteria
---

Create a JIRA issue based on the user's request.

## Steps

### 1. Research codebase
Use Glob, Grep, or Read to understand the request context.

### 2. Determine issue type
- **Story**: New user-facing features
- **Task**: Technical work, chores, documentation
- **Bug**: Fixes for incorrect behavior

### 3. Select parent epic
- Fetch open epics with `mcp__jira__list_epics`
- Match issue to epic by keywords and functional area

### 4. Create title
Format: `[component] <prefix>: <description>`

Examples:
- `[FE] feat: add logout button to navigation`
- `[BE] fix: resolve API timeout on large queries`

### 5. Draft body

```markdown
## Business Goal
Why this work matters.

## Technical Context
Relevant files, components, constraints.

## Implementation Notes
Patterns to follow, gotchas.
```

**Acceptance Criteria:** `- [ ] Testable outcome` (1-3 items)

### 6. Estimate story points
- 1pt: Simple, 1-2 steps
- 2pts: Straightforward, 3-4 steps
- 3pts: Moderate complexity
- 5pts: Complex, architectural

### 7. Preview and create
- Call `mcp__jira__create_issue` with confirm=false (preview)
- After user review, call again with confirm=true
