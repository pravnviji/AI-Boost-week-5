# API — AI Context

Read this before making any changes to `src/api/`.

## Directory Layout

```
src/api/
├── app/
│   ├── main.py              # FastAPI app, lifespan, middleware
│   ├── core/
│   │   ├── config.py         # Pydantic Settings (env-specific)
│   │   ├── auth/             # Authentication (client credentials)
│   │   └── tracing/          # Request ID tracing, structured logging
│   ├── routers/              # Route handlers (one file per resource)
│   ├── services/             # Business logic
│   ├── schemas/              # Pydantic request/response models
│   └── repositories/         # Database queries
├── tests/                    # Pytest tests (mirrors app/ structure)
├── pyproject.toml            # Dependencies, ruff/mypy config
└── ai-context.md             # This file
```

## Key Patterns

- **Routers stay thin** — they validate input, call a service, return a response
- **Services contain logic** — business rules, orchestration, error handling
- **Repositories own data access** — SQL queries, Snowflake calls
- **All functions have type hints** — enforced by mypy strict mode
- **Async everywhere** — use `async def` for route handlers and service methods

## Commands

```bash
uv run uvicorn app.main:app --reload    # Dev server at http://localhost:8000/docs
uv run pytest --cov=app                  # Tests with coverage
uv run ruff check                        # Lint
uv run mypy .                            # Type check
```

## Testing Conventions

- Test files mirror source: `app/services/item.py` → `tests/services/test_item.py`
- Use `pytest` fixtures for shared setup
- Mock external dependencies (Snowflake, APIs) — never call real services in tests
- Aim for >80% coverage on services
