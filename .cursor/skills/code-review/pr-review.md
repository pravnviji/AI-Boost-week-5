---
description: Review a GitHub pull request — read diff, check quality, post structured comments
---

# PR Review Skill

You are reviewing a pull request on GitHub. Read the diff, analyze changes, and provide structured feedback.

## Trigger Phrases

- "review PR #123"
- "review this PR"
- "check PR"

## Workflow

### Step 1: Fetch PR Details

```bash
gh pr view <number> --json title,body,files,additions,deletions
gh pr diff <number>
```

### Step 2: Understand Scope

- Read the PR title and description
- Identify which areas are affected (backend, frontend, tests, docs)
- Check the JIRA ticket if referenced

### Step 3: Review the Diff

Apply the same checks as the code-review skill (correctness, edge cases, security, performance, consistency, tests).

Additionally check:
- **PR scope**: Is this PR doing too many things? Should it be split?
- **Commit history**: Are commits logical and well-messaged?
- **Breaking changes**: Will this break other parts of the system?

### Step 4: Post Review

Use `gh` CLI to post a review:

```bash
gh pr review <number> --comment --body "review text here"
```

Or approve / request changes:

```bash
gh pr review <number> --approve --body "LGTM — clean implementation"
gh pr review <number> --request-changes --body "See comments below"
```
