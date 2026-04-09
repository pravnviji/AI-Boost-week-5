# Why Diataxis for AI-Ready Documentation

## The Problem

AI assistants search documentation the same way a new team member would — by intent. They need to know: "Am I looking for a tutorial, a how-to, a spec, or an explanation?"

Unstructured docs (a flat wiki, a single README) force AI to guess. Structured docs let AI navigate by intent.

## How Diataxis Helps AI

| Quadrant | User Intent | AI Behavior |
|----------|-------------|-------------|
| Tutorials | "I want to learn" | AI follows step-by-step, doesn't skip ahead |
| How-To Guides | "I want to do X" | AI finds the recipe, applies it to the user's context |
| Reference | "What's the spec?" | AI cites exact specifications, doesn't paraphrase |
| Explanation | "Why is it this way?" | AI provides context and reasoning |

## The AI_CONTEXT.md Pattern

The file `docs/3-reference/meta/AI_CONTEXT.md` acts as a **navigation guide for AI**:
- Maps question patterns to quadrants
- Lists key files by topic
- Sets response guidelines (cite sources, use glossary)

This means every AI interaction benefits from the documentation structure without any prompt engineering from the user.

## The Payoff

- Developers write docs once (for humans)
- AI reads the same docs (with AI_CONTEXT.md as a guide)
- No separate "AI knowledge base" to maintain
- Documentation quality improves because AI surfaces gaps
