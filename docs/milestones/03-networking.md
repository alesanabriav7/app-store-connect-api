# Milestone 3 - HTTP + Apps Data Layer

## Goal
Implement reusable HTTP transport and App Store Connect Apps repository.

## Decisions
- `HttpClient` abstraction keeps transport replaceable and testable.
- `FetchHttpClient` centralizes auth header, query serialization, and error mapping.
- `AppsApiRepository` maps API contracts to stable domain entities.

## Validation
- Transport tests validate bearer auth, URL/query composition, and non-2xx error handling.
- Repository tests validate payload mapping.
- Full `npm run verify` pass.
