# app-store-connect-api

A modular TypeScript client for the App Store Connect API built with Clean Architecture boundaries and MVVM-style feature orchestration.

## Architecture

- `src/core`: shared primitives and errors.
- `src/domain`: entities, repository contracts, and use cases.
- `src/data`: concrete infrastructure implementations.
- `src/features`: feature-focused orchestration (view-model style).

## Scripts

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run verify`
