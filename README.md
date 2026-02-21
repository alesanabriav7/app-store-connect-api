# app-store-connect-api

Use this project to authenticate with App Store Connect and list your apps from the terminal with minimal setup.
It handles JWT generation (ES256), authenticated API requests, and clean CLI output.

## What You Can Do

Current:
- Authenticate with App Store Connect using JWT credentials.
- List all apps in your account from CLI.
- Reuse the TypeScript modules in your own automation scripts.

Planned:
- Upload IPA builds.
- Upload and manage screenshots per locale/device.
- Manage app metadata (name, subtitle, description, keywords).
- Manage versions, phased release steps, and submission flows.

## Requirements

- Node.js 20+
- pnpm 10+

## Install

```bash
pnpm install
```

## Quick Start

```bash
pnpm verify
pnpm build
pnpm cli -- --help
```

Using `npx` (published package):

```bash
npx app-store-connect-api --help
```

## List Apps

```bash
ASC_ISSUER_ID="<issuer-id>" \
ASC_KEY_ID="<key-id>" \
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----" \
pnpm cli
```

With `npx`:

```bash
ASC_ISSUER_ID="<issuer-id>" \
ASC_KEY_ID="<key-id>" \
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----" \
npx app-store-connect-api
```

Fast dev run (no build):

```bash
ASC_ISSUER_ID="<issuer-id>" \
ASC_KEY_ID="<key-id>" \
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----" \
npx tsx src/cli/main.ts
```

Notes:
- `ASC_PRIVATE_KEY` supports escaped newlines (`\\n`).
- `ASC_BASE_URL` is optional and defaults to production App Store Connect API.

## Scripts

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm cli -- --help`
- `pnpm cli:dev -- --help`
- `pnpm verify`

## Internal Modules

- `src/core`: shared primitives and errors.
- `src/domain`: entities and use cases.
- `src/data`: auth, transport, and API repository.
- `src/features`: apps view-model orchestration.
- `src/cli`: executable entrypoint.
