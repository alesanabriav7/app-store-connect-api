# CLI Usage

## Install

```bash
pnpm install
```

## Show Help

```bash
pnpm build
pnpm cli -- --help
```

## List Apps

```bash
ASC_ISSUER_ID="<issuer-id>" \
ASC_KEY_ID="<key-id>" \
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----" \
pnpm cli
```

## Fast Dev Run (no build)

```bash
ASC_ISSUER_ID="<issuer-id>" \
ASC_KEY_ID="<key-id>" \
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----" \
npx tsx src/cli/main.ts
```

Notes:
- `ASC_PRIVATE_KEY` supports escaped newlines (`\\n`).
- `ASC_BASE_URL` is optional and defaults to production App Store Connect API.
