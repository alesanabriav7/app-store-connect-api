# CLI Usage

## Build

```bash
npm run build
```

## Show Help

```bash
npm run cli -- --help
```

## List Apps

```bash
ASC_ISSUER_ID="<issuer-id>" \
ASC_KEY_ID="<key-id>" \
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----" \
npm run cli
```

Notes:
- `ASC_PRIVATE_KEY` supports escaped newlines (`\\n`).
- `ASC_BASE_URL` is optional and defaults to production App Store Connect API.
