# Glossary

Domain terminology used across the project. AI assistants should read this before giving domain-specific advice.

| Term | Definition |
|------|-----------|
| **Scenario** | A documented user interaction flow with expected outcomes, stored as JSON in `docs/scenarios/` |
| **Page Object** | A class encapsulating UI element locators and actions for a single page (Playwright pattern) |
| **BDD String** | A canonical step description used in `test.step()` calls, stored in `*.bdd.ts` files |
| **Step Class** | A class containing test orchestration methods, each wrapping BDD steps |
| **Thin Spec** | A Playwright spec file that delegates all logic to step classes |
| **MCP** | Model Context Protocol — lets AI tools call external APIs (JIRA, database, browser) |
| **Diataxis** | Documentation framework with 4 quadrants: tutorials, how-tos, reference, explanation |
| **Conventional Commits** | Commit message format: `type(scope): description` |
