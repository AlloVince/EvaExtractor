# EvaExtractor AI Development Guide

This document is the working reference for AI-assisted development on EvaExtractor.
It summarizes the current architecture, coding expectations, and the safest default
choices for future changes.

## Project Purpose

EvaExtractor is a small TypeScript toolkit for:

- fetching content from local files, HTTP, Ali OSS, and MinIO
- parsing HTML metadata embedded by `HtmlPlus`
- extracting structured data from HTML
- transferring / transforming extracted output
- iterating records from file systems, MinIO, OSS, or databases

The codebase is intentionally lightweight. Prefer small, targeted changes over large
framework-style abstractions.

## Current Runtime Baseline

- Node.js: `>=24`
- Package manager: `pnpm`
- TypeScript: strict mode enabled
- Module format: CommonJS output

## Core Design

### Main flow

`HtmlProcessor` and `JsonProcessor` follow the same pipeline:

1. `fetch()` loads raw content.
2. `parse()` converts content into a structured payload.
3. `extract()` maps parsed content into a normalized object.
4. `transfer()` applies optional value transforms.
5. `load()` is left to subclasses or consumers.

### Key modules

- `src/index.ts`
  - processor classes
  - processor interfaces
  - storage and fetcher factory logic
- `src/fetchers.ts`
  - fetchers for file, HTTP, OSS, and MinIO
- `src/storages.ts`
  - persistence helpers for file, OSS, and MinIO
- `src/iterators.ts`
  - async iterators for file, OSS, MinIO, and databases
- `src/utils.ts`
  - `HtmlPlus`, `pipe`, and hashing helpers

## TypeScript Conventions

Use modern TypeScript defaults:

- keep `strict` compatibility
- prefer explicit return types on public methods
- use `override` on subclass methods
- initialize class fields or mark them with definite assignment when appropriate
- prefer `Record<string, ...>` over loose `{}` types
- avoid `any` unless the external SDK truly forces it
- prefer native Node APIs over compatibility packages

### Preferred patterns

- use `node:` imports for built-in modules
- prefer `async`/`await`
- prefer `Promise`-based Node APIs
- prefer stable built-in APIs before adding dependencies

### Avoid

- new `tslint` or other deprecated lint stacks
- reintroducing `nyc` unless coverage tooling becomes necessary again
- adding dependencies that duplicate Node core behavior
- expanding the public API without updating the documentation

## Dependency Policy

Default rule: every dependency must earn its place.

### Prefer removal when possible

This project already replaced some historical dependencies with Node core:

- `mkdirp` -> `fs.promises.mkdir(..., { recursive: true })`
- `get-stream` -> `node:stream/consumers`

When touching code, first ask:

1. Can Node 24 do this natively?
2. Can the existing dependency already cover it?
3. Is a new dependency worth the long-term maintenance cost?

### When adding a dependency

- keep it focused and well-maintained
- prefer packages that ship TypeScript types
- avoid bringing in transitive complexity just for convenience

## Testing Expectations

Use the existing AVA test style.

- keep tests focused on public behavior
- add tests for helper functions and deterministic logic
- prefer small unit tests over integration-heavy tests unless necessary

### Recommended test targets

- `HtmlPlus.stringify()` / `HtmlPlus.parse()`
- `hashUrlToPath()`
- iterator pagination behavior
- fetcher/storage path handling

## Change Strategy

When making a change:

1. preserve existing public behavior unless the task explicitly changes it
2. make the smallest coherent fix
3. update documentation alongside API or behavior changes
4. avoid unrelated refactors
5. check whether an old dependency or compatibility layer can be removed

If a change requires behavior tradeoffs, document the tradeoff in the same patch.

## Repository-Specific Notes

- `README.md` is currently minimal; this guide should be the primary AI-facing reference.
- The project is still a library, not an app shell.
- Keep outputs compatible with CommonJS consumers unless the repo is explicitly migrated.
- The package currently supports optional integrations for Ali OSS and MinIO via peer dependencies.

## Useful Commands

These are the intended local commands once dependencies are installed:

```bash
pnpm install
pnpm test
pnpm run lint
pnpm run build
```

## AI Working Rules

- read this guide before editing code
- prefer the current architecture over inventing a new one
- remove obsolete compatibility code instead of preserving it by default
- if behavior is ambiguous, inspect the surrounding source before changing it
- leave a concise note in your final response about what changed and why

