# Milestone 4 - Feature MVVM Module

## Goal
Provide a feature-focused MVVM layer for app listing, with predictable state transitions and composition helpers.

## Decisions
- ViewModel exposes immutable snapshot state and subscription API.
- Feature state is explicit (`idle`, `loading`, `loaded`, `error`) and test-driven.
- Composition helper wires repository + use case + view model for minimal setup.

## Validation
- Tests verify ordered state transitions, sorting behavior, and error handling.
- Full `npm run verify` pass.
