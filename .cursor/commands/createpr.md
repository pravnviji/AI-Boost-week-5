---
description: Create a pull request — checks changes, pushes branch, creates PR with conventional commit format
---

Create a pull request for the current branch.

## Steps

### 1. Check for uncommitted changes
- Run `git status`
- If uncommitted changes exist: stop and tell user to commit first

### 2. Verify branch
- Get current branch: `git branch --show-current`
- If on `main`: stop and tell user to create a feature branch

### 3. Extract JIRA ticket from branch name
- Parse `prefix/PROJ-XXX-description` format
- If no ticket found: stop

### 4. Analyze commits
Run in parallel:
- `git log main..HEAD --oneline`
- `git diff main...HEAD --stat`
- `git diff main...HEAD`

### 5. Draft PR
**Title:** `<type>(PROJ-XXX): <description>` (under 60 chars)

**Body:**
```markdown
## Summary
- What changed and why (1-3 bullets)
```

### 6. Push and create
```bash
git push -u origin <branch-name>
gh pr create --title "title" --body "body"
```

### 7. Display PR URL
