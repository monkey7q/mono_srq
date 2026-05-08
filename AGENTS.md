# AGENTS.md

## Repo Overview

This repository is a pnpm workspace monorepo.

## Structure

- `apps/` contains runnable applications
- `packages/` contains shared code and shared configs  


## Current Apps

- `apps/json-diagram`: current project  


## Conventions

- New apps go in `apps/<name>`
- Shared types, schemas, and constants go in `packages/     
shared`
- Do not place app code in the repository root  


## Commands

- Install: `pnpm install`
- Run current app: `pnpm dev`
- Build current app: `pnpm build`
- Typecheck workspace: `pnpm typecheck`
