# AGENTS.md

## Repo Overview

This repository is a `pnpm workspace` monorepo.

The current primary app is `apps/json-diagram`, a JSON-driven architecture diagram MVP.

## Structure

- `apps/` contains runnable applications
- `packages/` contains shared code and shared configs

## Current Apps

- `apps/json-diagram`

## Conventions

- New apps go in `apps/<name>`
- Shared schema, presets, validators, and common logic go in `packages/shared`
- Do not place business app code in the repository root
- Prefer keeping MVP scope tight instead of expanding speculative features

## Current Product Scope

For `apps/json-diagram`, the current intended scope is:

- Natural language -> Diagram JSON
- Diagram JSON -> single fixed-style generation prompt
- History snapshot viewing for input / JSON / prompt

Out of scope for now:

- multi-style preset systems
- complex diff / rollback workflows
- heavy backend platformization
- multiple diagram types

## Commands

- Install dependencies: `pnpm install`
- Run current app: `pnpm dev`
- Build current app: `pnpm build`
- Run tests: `pnpm test`
- Typecheck workspace: `pnpm typecheck`

## Editing Notes

- If changing prompt generation behavior, update both:
  - `packages/shared`
  - `apps/json-diagram/src/prompt-builder.js`
- If changing preset defaults, update:
  - shared preset definitions
  - UI default values
  - related tests
