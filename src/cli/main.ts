#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import { AppStoreConnectJwtTokenProvider } from "../data/auth/app-store-connect-jwt-token-provider.js";
import { AppsApiRepository } from "../data/apps/apps-api-repository.js";
import { FetchHttpClient } from "../data/http/fetch-http-client.js";
import { createAppsListViewModel } from "../features/apps/create-apps-list-feature.js";
import { resolveCliEnvironment } from "./environment.js";

interface CliOptions {
  readonly help: boolean;
}

export function parseCliOptions(argv: readonly string[]): CliOptions {
  return {
    help: argv.includes("--help") || argv.includes("-h")
  };
}

function printHelp(): void {
  console.log(`app-store-connect-api CLI

Usage:
  npm run cli -- --help
  npm run cli

Required environment variables:
  ASC_ISSUER_ID
  ASC_KEY_ID
  ASC_PRIVATE_KEY

Optional environment variables:
  ASC_BASE_URL (default: https://api.appstoreconnect.apple.com/)
`);
}

export async function runCli(
  argv: readonly string[],
  env: NodeJS.ProcessEnv
): Promise<number> {
  const options = parseCliOptions(argv);

  if (options.help) {
    printHelp();
    return 0;
  }

  try {
    const config = resolveCliEnvironment(env);

    const tokenProvider = new AppStoreConnectJwtTokenProvider({
      issuerId: config.issuerId,
      keyId: config.keyId,
      privateKey: config.privateKey
    });

    const httpClient = new FetchHttpClient(config.baseUrl, tokenProvider);
    const appsRepository = new AppsApiRepository(httpClient);
    const viewModel = createAppsListViewModel(appsRepository);

    await viewModel.refresh();

    if (viewModel.snapshot.status === "error") {
      console.error(`Failed to load apps: ${viewModel.snapshot.errorMessage}`);
      return 1;
    }

    if (viewModel.snapshot.apps.length === 0) {
      console.log("No apps were returned by App Store Connect.");
      return 0;
    }

    console.log("Apps:");
    for (const app of viewModel.snapshot.apps) {
      console.log(`- ${app.name} (${app.bundleId}) [${app.id}]`);
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CLI error";
    console.error(message);
    return 1;
  }
}

function isExecutedAsScript(): boolean {
  const executedPath = process.argv[1];

  if (!executedPath) {
    return false;
  }

  return import.meta.url === pathToFileURL(executedPath).href;
}

if (isExecutedAsScript()) {
  const exitCode = await runCli(process.argv.slice(2), process.env);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
