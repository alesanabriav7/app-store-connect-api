# app-store-connect-api

A modular TypeScript client for the App Store Connect API built with Clean Architecture boundaries and MVVM-style feature composition.

## TypeScript Validation

This repository is fully TypeScript-first and validated via:

```bash
npm run verify
```

`verify` runs typecheck, unit tests, build, and a CLI runtime check (`--help`).

## Architecture

- `src/core`: shared primitives and error contracts.
- `src/domain`: entities, repository contracts, and use cases.
- `src/data`: auth, transport, endpoint contracts, and repository implementations.
- `src/features`: MVVM-style feature state and view model orchestration.
- `src/cli`: executable composition entrypoint.

## Scripts

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run cli -- --help`
- `npm run verify`

## Milestones

- `docs/milestones/01-foundation.md`
- `docs/milestones/02-auth.md`
- `docs/milestones/03-networking.md`
- `docs/milestones/04-feature-mvvm.md`
- `docs/milestones/05-cli-and-verification.md`

## CLI Example

See `docs/usage/cli.md` for environment variables and execution examples.
