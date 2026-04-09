# JIRA MCP Server

MCP (Model Context Protocol) server that lets AI assistants interact with JIRA directly from the IDE.

## What It Does

- Create, update, and query JIRA issues
- Transition issue status (e.g., "To Do" → "In Progress")
- List epics, sprint issues, backlog
- Link issues to parent epics

## Setup

### 1. Environment Variables

```bash
export JIRA_BASE_URL="https://your-org.atlassian.net"
export JIRA_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_PROJECT_KEY="PROJ"
```

### 2. Configure in `.mcp.json`

```json
{
  "mcpServers": {
    "jira": {
      "type": "stdio",
      "command": "bash",
      "args": ["tools/jira-mcp/run-mcp.sh"]
    }
  }
}
```

### 3. Available Tools

| Tool | Description |
|------|-------------|
| `get_issue_details` | Fetch full issue info (title, description, status, points) |
| `create_issue` | Create a new story, task, or bug |
| `update_issue` | Update fields on an existing issue |
| `transition_issue` | Change issue status |
| `list_epics` | List all open epics |
| `search_issues` | JQL search |

## How AI Uses It

The Cursor commands `/startwork`, `/createpr`, and `/createissue` all use this MCP server under the hood. When a developer types `/startwork PROJ-123`, the AI:

1. Calls `get_issue_details` to fetch the ticket
2. Creates a branch with the correct naming convention
3. Calls `transition_issue` to move it to "In Progress"
