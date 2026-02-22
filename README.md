# appstore-tools

TypeScript CLI and library for App Store Connect. Authenticate with JWT, list apps, generate IPAs, and upload builds — all from your terminal.

## Installation

### From npm

```bash
npx appstore-tools --help
```

Or install globally:

```bash
npm install -g appstore-tools
appstore-tools --help
```

### From source

```bash
git clone https://github.com/alesanabriav7/appstore-tools.git
cd appstore-tools
pnpm install
npm link
appstore-tools --help
```

## Setup

Requires Node.js 20+ and an [App Store Connect API key](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api).

Set these environment variables (via `.env`, shell, or CI secrets):

```env
ASC_ISSUER_ID=your-issuer-id
ASC_KEY_ID=your-key-id
```

For the private key, point to your `.p8` file (recommended):

```env
ASC_PRIVATE_KEY_PATH=./AuthKey_XXXXXX.p8
```

Or pass the key inline:

```env
ASC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

`ASC_PRIVATE_KEY_PATH` takes priority when both are set. `ASC_BASE_URL` is optional and defaults to `https://api.appstoreconnect.apple.com/`.

## Usage

### List apps

```bash
npx appstore-tools apps list
```

JSON output:

```bash
npx appstore-tools apps list --json
```

### Generate IPA

No credentials required.

From xcodebuild:

```bash
npx appstore-tools ipa generate \
  --output-ipa ./dist/MyApp.ipa \
  --scheme MyApp \
  --workspace-path ./MyApp.xcworkspace \
  --export-options-plist ./ExportOptions.plist
```

From a custom command:

```bash
npx appstore-tools ipa generate \
  --output-ipa ./dist/MyApp.ipa \
  --build-command "make build-ipa" \
  --generated-ipa-path ./build/MyApp.ipa
```

### Upload build

Dry-run by default — verifies the IPA locally without uploading:

```bash
npx appstore-tools builds upload \
  --app com.example.myapp \
  --version 1.2.3 \
  --build-number 45 \
  --ipa ./dist/MyApp.ipa
```

Add `--apply` to upload, `--wait-processing` to poll until done:

```bash
npx appstore-tools builds upload \
  --app com.example.myapp \
  --version 1.2.3 \
  --build-number 45 \
  --ipa ./dist/MyApp.ipa \
  --apply --wait-processing
```

Build and upload in one step (xcodebuild mode):

```bash
npx appstore-tools builds upload \
  --app com.example.myapp \
  --version 1.2.3 \
  --build-number 45 \
  --scheme MyApp \
  --workspace-path ./MyApp.xcworkspace \
  --export-options-plist ./ExportOptions.plist \
  --apply
```

#### Preflight checks

Every upload runs these checks before touching App Store Connect:

- File exists, is readable, has `.ipa` extension
- Archive contains `Payload/*.app/Info.plist`
- Bundle ID, version, and build number match expectations
- Code signing is valid (`codesign --verify --strict --deep`)
- SHA-256 and MD5 checksums computed

### Help

```bash
npx appstore-tools --help
```

## Library usage

```typescript
import { AppStoreConnectClient, listApps } from "appstore-tools";

const client = new AppStoreConnectClient({
  issuerId: process.env.ASC_ISSUER_ID!,
  keyId: process.env.ASC_KEY_ID!,
  privateKey: process.env.ASC_PRIVATE_KEY!
});

const apps = await listApps(client);
console.log(apps);
```

## Development

```bash
pnpm install
pnpm verify          # typecheck + test + build + help
```

Individual commands:

```bash
pnpm typecheck       # type check
pnpm test            # run tests
pnpm build           # compile to dist/
pnpm cli -- --help   # run built CLI
pnpm cli:dev -- --help  # run from source (no build needed)
```

## Project structure

```
src/
  api/
    client.ts        # HTTP client with JWT auth
    types.ts         # Shared upload operation types
  commands/
    apps-list.ts     # apps list command
    builds-upload.ts # builds upload command
    ipa-generate.ts  # ipa generate command
  ipa/
    artifact.ts      # IPA resolution (prebuilt/xcodebuild/custom)
    preflight.ts     # IPA verification
  cli.ts             # CLI entry point
  index.ts           # Public API exports
```
