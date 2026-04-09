# AI in Code — Sample Repository

A reference implementation showing how to set up a codebase for effective AI-assisted development. This repo demonstrates the patterns, configurations, and workflows used in a real production monorepo.

## What This Repo Shows

This is not a working application — it's a **template** showing how to configure AI tooling in a real project. Every file is a working example you can copy and adapt.

---

## Repository Structure

```
AICode/
├── .cursor/                    # AI IDE configuration
│   ├── rules/                  # Always-on guardrails for AI
│   │   ├── general-rule.mdc    # Project-wide conventions
│   │   ├── backend.mdc         # FastAPI-specific patterns
│   │   ├── frontend.mdc        # Angular-specific patterns
│   │   └── sonarqube-mcp.mdc   # Code quality analysis integration
│   ├── skills/                 # Reusable expert workflows
│   │   ├── code-review/        # Structured diff review + PR review
│   │   └── domain-expert/      # Business planning & validation
│   └── commands/               # One-click slash commands
│       ├── startwork.md        # /startwork PROJ-123 → branch + JIRA transition
│       ├── createpr.md         # /createpr → push + PR with conventional format
│       ├── createissue.md      # /createissue → structured JIRA ticket
│       └── run-workflow.md     # /run-workflow → trigger GitHub Actions
│
├── .mcp.json                   # MCP server configuration (JIRA, Playwright, Angular CLI)
│
├── docs/                       # Diataxis-structured documentation
│   ├── 1-tutorials/            # Learning-oriented: step-by-step lessons
│   ├── 2-how-to-guides/        # Task-oriented: how to add rules, skills
│   ├── 3-reference/            # Specs, glossary, AI navigation guide
│   │   └── meta/AI_CONTEXT.md  # How AI should navigate docs
│   ├── 4-explanation/          # Concepts: why Diataxis, architecture decisions
│   └── scenarios/              # Test scenario catalog (JSON)
│
├── src/
│   ├── api/                    # Backend (FastAPI)
│   │   └── ai-context.md       # Per-project AI context
│   └── frontend/               # Frontend (Angular)
│
├── e2e/                        # Playwright end-to-end tests
│   ├── tests/                  # Thin specs
│   ├── steps/                  # Step classes + BDD strings
│   └── pages/                  # Page objects
│
└── tools/
    └── jira-mcp/               # JIRA MCP server for AI integration
```

---

## Layer 1: Rules (Guardrails)

**What:** `.cursor/rules/*.mdc` files that AI follows automatically.

**Why:** Without rules, AI generates code that looks right but doesn't match your project's conventions. Rules enforce patterns like lint compliance, architecture constraints, and coding style.

**How it works:**
- `alwaysApply: true` → rule is active on every interaction
- `globs: src/api/**` → rule only activates when working in matching files
- AI reads rules before generating any code

| Rule | Purpose |
|------|---------|
| `general-rule.mdc` | Project structure, git workflow, package managers |
| `backend.mdc` | FastAPI layered architecture, testing patterns |
| `frontend.mdc` | Angular conventions, lint requirements |
| `sonarqube-mcp.mdc` | Run static analysis after code generation |

---

## Layer 2: Skills (Expert Workflows)

**What:** `.cursor/skills/*/SKILL.md` files that give AI a specialized persona and step-by-step workflow.

**Why:** Rules tell AI what to avoid. Skills tell AI what to do — repeatable workflows for common tasks like code review, domain validation, or test generation.

| Skill | What It Does |
|-------|-------------|
| `code-review/SKILL.md` | Reads git diff, runs linters, outputs findings grouped by severity |
| `code-review/pr-review.md` | Reviews GitHub PRs via `gh` CLI, posts structured comments |
| `domain-expert/SKILL.md` | Reads domain docs, queries database, validates business logic |

---

## Layer 3: Commands (One-Click Workflows)

**What:** `.cursor/commands/*.md` files that define slash commands in Cursor chat.

**Why:** Commands chain multiple steps (git, JIRA, GitHub) into a single action. Instead of manually creating branches, transitioning tickets, and pushing PRs, you type one command.

| Command | What It Does |
|---------|-------------|
| `/startwork PROJ-123` | Fetches JIRA ticket → creates branch → transitions to "In Progress" |
| `/createpr` | Analyzes commits → drafts PR title/body → pushes → creates PR via `gh` |
| `/createissue` | Researches codebase → picks epic → writes JIRA ticket with acceptance criteria |
| `/run-workflow` | Triggers GitHub Actions (e2e, deploy) on current branch |

---

## Layer 4: MCP Servers (Tool Connections)

**What:** `.mcp.json` configures external tools that AI can call directly.

**Why:** AI stops being a "code suggester" and becomes a connected developer that can interact with JIRA, run browser tests, and execute build commands.

| Server | What AI Can Do |
|--------|---------------|
| `jira` | Create/update issues, transition status, query sprints |
| `playwright` | Navigate pages, click elements, take screenshots |
| `angular-cli` | Run build, test, serve, modernize |

---

## Layer 5: Documentation as Knowledge Base

**What:** `docs/` structured using the Diataxis framework + `AI_CONTEXT.md` navigation guide.

**Why:** AI navigates docs by intent (tutorial vs. how-to vs. reference vs. explanation). The `AI_CONTEXT.md` file teaches AI how to find what it needs without prompt engineering from the user.

**Key files:**
- `docs/3-reference/meta/AI_CONTEXT.md` — AI navigation guide
- `docs/3-reference/GLOSSARY.md` — domain terminology
- `src/api/ai-context.md` — per-project context (architecture, patterns, commands)

---

## Layer 6: Scenario-Driven E2E Testing

**What:** `docs/scenarios/*.scenarios.json` defines test scenarios. AI generates Playwright tests from them.

**Why:** Business requirements drive tests, not the other way around. AI reads the scenario JSON (user action + expected outcome + source files) and generates the full test stack: Page Object → BDD strings → Step class → thin Spec.

**The flow:**
1. Scenarios documented in `docs/scenarios/dashboard.scenarios.json`
2. AI reads scenario data (id, title, userAction, expectedOutcome, sourceFiles)
3. AI generates `e2e/pages/`, `e2e/steps/`, `e2e/tests/` files
4. AI wires `testFile` + `testReference` back to scenario JSON
5. Coverage reports regenerated

**See working examples:**
- `e2e/pages/dashboard.page.ts` — Page Object
- `e2e/steps/dashboard.bdd.ts` — BDD strings
- `e2e/steps/dashboard.steps.ts` — Step class
- `e2e/tests/dashboard.spec.ts` — Thin spec

---

## Getting Started

### Try it yourself

1. Clone this repo
2. Open in [Cursor](https://cursor.sh/)
3. Type `/startwork` in chat to see the command in action
4. Ask Cursor: "Review my code changes" to trigger the code-review skill
5. Ask: "What is the dashboard scenario coverage?" — AI reads `docs/scenarios/` and reports

### Adapt for your project

1. Copy `.cursor/` folder to your repo
2. Edit rules to match your conventions
3. Create skills for your team's workflows
4. Add `ai-context.md` to each project directory
5. Structure docs using Diataxis with an `AI_CONTEXT.md` guide

---

## Summary

| Layer | What | Where | Purpose |
|-------|------|-------|---------|
| Rules | Guardrails | `.cursor/rules/` | AI follows project conventions automatically |
| Skills | Expert workflows | `.cursor/skills/` | Repeatable tasks: review, plan, validate |
| Commands | Slash commands | `.cursor/commands/` | One-click: branch, PR, issue, deploy |
| MCP | Tool connections | `.mcp.json` | AI talks to JIRA, browser, build tools |
| Docs | Knowledge base | `docs/` + `ai-context.md` | AI navigates by intent, not keywords |
| Scenarios | Test contracts | `docs/scenarios/` | Business requirements drive test generation |
| Quality | Safety net | SonarQube MCP + pre-commit | Same quality bar for AI and human code |
