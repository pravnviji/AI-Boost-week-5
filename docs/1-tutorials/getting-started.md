# Getting Started

## Prerequisites

- [Cursor IDE](https://cursor.sh/) installed
- Node.js 20+
- Python 3.12+ with [uv](https://github.com/astral-sh/uv)
- Git

## First-Time Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd AICode
```

### 2. Install dependencies

```bash
# Backend
cd src/api && uv sync --frozen

# Frontend
cd src/frontend && yarn install

# E2E
cd e2e && yarn install
```

### 3. Set up Cursor

The repo is pre-configured with:
- **Rules** (`.cursor/rules/`) — always-on guardrails for AI
- **Skills** (`.cursor/skills/`) — reusable expert workflows
- **Commands** (`.cursor/commands/`) — one-click slash commands

### 4. Configure MCP servers

Copy `.mcp.json` to your Cursor config if needed. MCP servers give AI access to JIRA, Playwright, and Angular CLI.

### 5. Try it out

Open Cursor and type `/startwork PROJ-123` in chat to:
1. Fetch the JIRA ticket
2. Create a feature branch
3. Transition the ticket to "In Progress"
