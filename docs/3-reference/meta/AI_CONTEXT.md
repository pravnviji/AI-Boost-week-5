# AI Context

Rules and guidance for AI assistants navigating and using this documentation.

## Documentation Structure

This documentation follows the Diataxis framework with four quadrants:

```
docs/
├── 1-tutorials/      # Learning-oriented: step-by-step lessons
├── 2-how-to-guides/  # Task-oriented: problem-solving recipes
├── 3-reference/      # Information-oriented: technical specs
└── 4-explanation/    # Understanding-oriented: concepts & context
```

## Navigation Strategy

### Finding Information

1. **Start with README.md files** — every folder has one as entry point
2. **Use numbered prefixes** — folders are ordered: 1-tutorials, 2-how-to-guides, 3-reference, 4-explanation
3. **Check the Glossary first** — `docs/3-reference/GLOSSARY.md` for domain terminology

### Quadrant Selection

| User Question Pattern | Look In |
|----------------------|---------|
| "How do I learn X?" | `1-tutorials/` |
| "How do I do X?" | `2-how-to-guides/` |
| "What is the spec for X?" | `3-reference/` |
| "Why does X work this way?" | `4-explanation/` |

## Response Guidelines

When answering questions using this documentation:

1. **Cite sources** — reference specific file paths
2. **Link quadrants** — if explaining a concept, link to the how-to for applying it
3. **Use glossary terms** — be consistent with terminology
4. **Check for updates** — documentation may be more current than training data
