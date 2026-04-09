---
description: Start work on a JIRA issue — creates branch, transitions to In Progress, shows details
---

Start work on a JIRA issue. User provides the issue key (e.g. PROJ-123).

## Steps

### 1. Fetch JIRA issue
- Use `mcp__jira__get_issue_details` to get title, type, description, acceptance criteria, story points

### 2. Create feature branch
- `git fetch origin`
- Branch name: `feat/PROJ-XXX-short-description` (kebab-case from JIRA summary)
- `git checkout -b <branch-name> origin/main`

### 3. Transition JIRA issue
- Move to "In Progress" via JIRA MCP
- If transition fails, note it but continue

### 4. Display summary
Show:
- Branch name created
- JIRA status
- Issue title, description, acceptance criteria, story points
