# Milestone 2 - JWT Authentication

## Goal
Implement robust App Store Connect JWT authentication with strict validation and reusable token caching.

## Decisions
- ES256 signing via Node crypto (`dsaEncoding: ieee-p1363`) for JWT compatibility.
- Cache generated token and refresh 30 seconds before expiration.
- Keep auth config at domain boundary and implementation in data layer.

## Validation
- Unit tests verify claims, signature validity, cache behavior, and invalid TTL handling.
- Full `npm run verify` pass.
