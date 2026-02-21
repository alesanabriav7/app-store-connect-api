# app-store-connect-api

A modular TypeScript client for the App Store Connect API built with Clean Architecture boundaries and MVVM-style feature composition.

## Requirements

- Node.js 20+
- pnpm 10+

## Install

```bash
pnpm install
```

## Verify

```bash
pnpm verify
```

`verify` runs typecheck, tests, build, and a CLI runtime check (`--help`).

## CLI

```bash
pnpm build
pnpm cli -- --help
```

Development without build:

```bash
npx tsx src/cli/main.ts --help
```

## Scripts

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm cli -- --help`
- `pnpm cli:dev -- --help`
- `pnpm verify`

## Project Layout

- `src/core`: shared primitives and error contracts.
- `src/domain`: entities, repository contracts, and use cases.
- `src/data`: auth, transport, endpoint contracts, and repository implementations.
- `src/features`: MVVM-style feature state and view model orchestration.
- `src/cli`: executable composition entrypoint.

## Docs

- `/Users/ale/Dev/app-store-connect-api/docs/usage/cli.md`
