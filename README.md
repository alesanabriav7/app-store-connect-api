# app-store-connect-api

Use this project to authenticate with App Store Connect and list your apps from the terminal with minimal setup.
It handles JWT generation (ES256), authenticated API requests, and clean CLI output.

## What You Can Do

Current:
- Authenticate with App Store Connect using JWT credentials.
- List all apps in your account from CLI.
- Generate IPA artifacts from local projects (`xcodebuild` or custom command).
- Upload IPA builds with strict local preflight verification.
- Upload and manage screenshots per locale/device via reusable data/domain modules.
- Manage localized app metadata (`name`, `subtitle`, `description`, `keywords`) via reusable modules.
- Manage app versions, phased release state transitions, and submission flows via reusable modules.
- Reuse the TypeScript modules in your own automation scripts.

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

## Generate IPA Locally

`ipa generate` does not require App Store Connect credentials.

Generate via `xcodebuild`:

```bash
pnpm cli -- ipa generate \
  --output-ipa ./dist/MyApp.ipa \
  --scheme MyApp \
  --workspace-path ./MyApp.xcworkspace \
  --export-options-plist ./ExportOptions.plist
```

Generate via custom command:

```bash
pnpm cli -- ipa generate \
  --output-ipa ./dist/MyApp.ipa \
  --build-command "make build-ipa" \
  --generated-ipa-path ./build/MyApp.ipa
```

## Upload IPA Build

`builds upload` always performs strict local preflight verification first:
- file readability and `.ipa` extension
- archive structure (`Payload/*.app/Info.plist`)
- bundle id / version / build number checks
- code signing checks (`codesign --verify --strict --deep` and `codesign -dv`)
- local SHA-256 and MD5 checksums

By default, upload runs in dry-run mode. Add `--apply` to execute mutations.

Upload prebuilt IPA:

```bash
ASC_ISSUER_ID="<issuer-id>" \
ASC_KEY_ID="<key-id>" \
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----" \
pnpm cli -- builds upload \
  --app com.example.myapp \
  --version 1.2.3 \
  --build-number 45 \
  --ipa ./dist/MyApp.ipa
```

Upload and apply changes:

```bash
ASC_ISSUER_ID="<issuer-id>" \
ASC_KEY_ID="<key-id>" \
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----" \
pnpm cli -- builds upload \
  --app com.example.myapp \
  --version 1.2.3 \
  --build-number 45 \
  --ipa ./dist/MyApp.ipa \
  --apply \
  --wait-processing
```

Upload with inline generation (`xcodebuild` mode):

```bash
ASC_ISSUER_ID="<issuer-id>" \
ASC_KEY_ID="<key-id>" \
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----" \
pnpm cli -- builds upload \
  --app com.example.myapp \
  --version 1.2.3 \
  --build-number 45 \
  --scheme MyApp \
  --workspace-path ./MyApp.xcworkspace \
  --export-options-plist ./ExportOptions.plist \
  --apply
```

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
