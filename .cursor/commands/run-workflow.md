---
description: Trigger a GitHub Actions workflow on the current branch without leaving the IDE
---

Trigger a CI/CD workflow from the terminal.

## Steps

### 1. Choose workflow
Ask the user:

| Option | Workflow | Description |
|--------|----------|-------------|
| **e2e** | `e2e-tests.yml` | Playwright end-to-end tests |
| **api** | `deploy-api.yml` | Build and deploy backend |
| **frontend** | `deploy-frontend.yml` | Build and deploy frontend |

### 2. Detect branch
```bash
git branch --show-current
```

### 3. Trigger
```bash
gh workflow run <workflow>.yml --ref <branch>
```

### 4. Report run URL
Wait 5 seconds, then:
```bash
gh run list --workflow=<workflow>.yml --limit=1 --json url,status --jq '.[0]'
```
