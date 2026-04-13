/**
 * Base for step classes — business-level workflows that orchestrate page objects.
 * BDD strings live next to each feature in *.bdd.ts; step classes call test.step(bddText, ...).
 * Layering: tests → steps (here) → pages / components.
 */
export abstract class BaseStep {}
