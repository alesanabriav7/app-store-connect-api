# Milestone 5 - CLI + Verification

## Goal
Add an executable CLI entrypoint and ensure verification validates build, tests, and runtime wiring.

## Decisions
- CLI composes auth, HTTP client, repository, use case, and MVVM view model.
- Environment parsing is isolated/tested to avoid configuration errors.
- Verification now confirms CLI help execution after build.

## Validation
- CLI-related unit tests pass.
- `npm run verify` includes typecheck, tests, build, and CLI help command.
