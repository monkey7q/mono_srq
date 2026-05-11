# AGENTS.md

## App Overview

`apps/json-diagram` is the current MVP app in this monorepo.

It is a JSON-first architecture diagram workbench.

## Product Intent

This app is intentionally narrow:

- Convert natural language into structured diagram JSON
- Convert diagram JSON into a single fixed-style generation prompt
- Preserve history snapshots for prompt / JSON / input review

This app is **not** currently a general-purpose visual editor.

## Scope Rules

Keep the current scope tight unless the user explicitly expands it:

- One supported diagram type: `layered_architecture`
- One supported style preset
- History snapshots are for viewing and reuse
- Avoid introducing speculative version diff / rollback features by default

## Important Files

- `app/workbench.js`
  - main UI entry
- `app/api/*`
  - BFF routes
- `src/index.js`
  - natural language -> JSON -> prompt pipeline
- `src/prompt-builder.js`
  - JSON -> generation prompt
- `src/regenerate.js`
  - edited JSON -> validated JSON -> generation prompt
- `src/records.js`
  - persistence layer wrapper
- `prisma/schema.prisma`
  - SQLite schema
- `../../packages/shared/src/index.js`
  - shared schema, preset definitions, validation

## Editing Rules

- If changing preset identity or defaults, update:
  - `packages/shared`
  - UI defaults
  - tests
- If changing generation quality, prioritize:
  - schema clarity
  - prompt-builder stability
  - style consistency
- Do not add new diagram types casually
- Do not reintroduce multiple style presets unless explicitly requested

## Commands

- Run dev server: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test`
- Generate Prisma client: `pnpm db:generate`
- Push schema to SQLite: `pnpm db:push`
