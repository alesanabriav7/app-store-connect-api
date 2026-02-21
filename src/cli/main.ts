#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import { parseCliCommand, type CliCommand } from "./command-parser.js";
import type { AppSummary } from "../domain/entities/app.js";
import { UploadIpaBuildUseCase } from "../domain/use-cases/upload-ipa-build-use-case.js";
import { AppStoreConnectJwtTokenProvider } from "../data/auth/app-store-connect-jwt-token-provider.js";
import { AppsApiRepository } from "../data/apps/apps-api-repository.js";
import { BuildUploadsApiRepository } from "../data/builds/build-uploads-api-repository.js";
import { FetchHttpClient } from "../data/http/fetch-http-client.js";
import { DefaultIpaArtifactProvider } from "../data/local/default-ipa-artifact-provider.js";
import { CustomCommandIpaArtifactProvider } from "../data/local/custom-command-ipa-artifact-provider.js";
import { HttpUploadOperationsExecutor } from "../data/local/http-upload-operations-executor.js";
import { NodeProcessRunner } from "../data/local/node-process-runner.js";
import { PrebuiltIpaArtifactProvider } from "../data/local/prebuilt-ipa-artifact-provider.js";
import { StrictIpaPreflightVerifier } from "../data/local/strict-ipa-preflight-verifier.js";
import { XcodebuildIpaArtifactProvider } from "../data/local/xcodebuild-ipa-artifact-provider.js";
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
  pnpm cli -- --help
  pnpm cli
  pnpm cli -- apps list [--json]
  pnpm cli -- ipa generate --output-ipa <path> [xcodebuild/custom options] [--json]
  pnpm cli -- builds upload --app <appId|bundleId> --version <x.y.z> --build-number <n> (--ipa <path> | [generation options]) [--wait-processing] [--json] [--apply]

Required environment variables:
  ASC_ISSUER_ID
  ASC_KEY_ID
  ASC_PRIVATE_KEY

Optional environment variables:
  ASC_BASE_URL (default: https://api.appstoreconnect.apple.com/)

Generation options (xcodebuild mode):
  --scheme <name> --export-options-plist <path> (--workspace-path <path> | --project-path <path>)
  [--configuration <Release>] [--archive-path <path>] [--derived-data-path <path>] [--output-ipa <path>]

Generation options (custom mode):
  --build-command "<shell command>" --generated-ipa-path <path> [--output-ipa <path>]
`);
}

export async function runCli(
  argv: readonly string[],
  env: NodeJS.ProcessEnv
): Promise<number> {
  try {
    const command = parseCliCommand(argv);
    return handleCliCommand(command, env);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CLI error";
    console.error(message);
    return 1;
  }
}

async function handleCliCommand(
  command: CliCommand,
  env: NodeJS.ProcessEnv
): Promise<number> {
  if (command.kind === "help") {
    printHelp();
    return 0;
  }

  if (command.kind === "ipa-generate") {
    return handleIpaGenerateCommand(command);
  }

  const context = createAuthenticatedContext(env);

  if (command.kind === "apps-list") {
    return handleAppsListCommand(context.appsRepository, command.json);
  }

  if (command.kind === "builds-upload") {
    return handleBuildUploadCommand(context, command);
  }

  return assertNever(command);
}

function createAuthenticatedContext(env: NodeJS.ProcessEnv): {
  readonly appsRepository: AppsApiRepository;
  readonly buildUploadsRepository: BuildUploadsApiRepository;
} {
  const config = resolveCliEnvironment(env);

  const tokenProvider = new AppStoreConnectJwtTokenProvider({
    issuerId: config.issuerId,
    keyId: config.keyId,
    privateKey: config.privateKey
  });

  const httpClient = new FetchHttpClient(config.baseUrl, tokenProvider);

  return {
    appsRepository: new AppsApiRepository(httpClient),
    buildUploadsRepository: new BuildUploadsApiRepository(httpClient)
  };
}

async function handleAppsListCommand(
  appsRepository: AppsApiRepository,
  json: boolean
): Promise<number> {
  const viewModel = createAppsListViewModel(appsRepository);
  await viewModel.refresh();

  if (viewModel.snapshot.status === "error") {
    console.error(`Failed to load apps: ${viewModel.snapshot.errorMessage}`);
    return 1;
  }

  if (json) {
    console.log(JSON.stringify(viewModel.snapshot.apps, null, 2));
    return 0;
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
}

async function handleIpaGenerateCommand(
  command: Extract<CliCommand, { kind: "ipa-generate" }>
): Promise<number> {
  const processRunner = new NodeProcessRunner();
  const artifactProvider = createIpaArtifactProvider(processRunner);
  const preflightVerifier = new StrictIpaPreflightVerifier(processRunner);

  const artifact = await artifactProvider.resolve(command.ipaSource);

  try {
    const report = await preflightVerifier.verifyStrict({
      ipaPath: artifact.ipaPath
    });

    if (command.json) {
      console.log(
        JSON.stringify(
          {
            outputIpaPath: command.outputIpaPath,
            report
          },
          null,
          2
        )
      );
    } else {
      console.log(`Generated IPA: ${command.outputIpaPath}`);
      console.log(`Bundle ID: ${report.bundleId ?? "unknown"}`);
      console.log(`Version: ${report.version ?? "unknown"} (${report.buildNumber ?? "unknown"})`);
      console.log(`SHA-256: ${report.sha256 ?? "unavailable"}`);
      console.log(`Signing validated: ${report.signingValidated ? "yes" : "no"}`);
    }

    if (report.errors.length > 0) {
      report.errors.forEach((line) => console.error(`- ${line}`));
      return 1;
    }

    return 0;
  } finally {
    if (artifact.dispose) {
      await artifact.dispose();
    }
  }
}

async function handleBuildUploadCommand(
  context: ReturnType<typeof createAuthenticatedContext>,
  command: Extract<CliCommand, { kind: "builds-upload" }>
): Promise<number> {
  const app = await resolveAppReference(context.appsRepository, command.appReference);

  const processRunner = new NodeProcessRunner();
  const artifactProvider = createIpaArtifactProvider(processRunner);
  const preflightVerifier = new StrictIpaPreflightVerifier(processRunner);
  const uploadUseCase = new UploadIpaBuildUseCase({
    artifactProvider,
    preflightVerifier,
    buildUploadsRepository: context.buildUploadsRepository,
    uploadOperationsExecutor: new HttpUploadOperationsExecutor(),
    sleep: (milliseconds) =>
      new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
      })
  });

  const result = await uploadUseCase.execute({
    ipaSource: command.ipaSource,
    appId: app.id,
    expectedBundleId: app.bundleId,
    expectedVersion: command.version,
    expectedBuildNumber: command.buildNumber,
    verificationMode: "strict",
    waitProcessing: command.waitProcessing,
    apply: command.apply
  });

  if (command.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Mode: ${result.mode}`);
    console.log(`App: ${app.name} (${app.bundleId}) [${app.id}]`);
    console.log(`IPA: ${result.preflightReport.ipaPath}`);
    console.log(`SHA-256: ${result.preflightReport.sha256 ?? "unavailable"}`);
    console.log(`Signing validated: ${result.preflightReport.signingValidated ? "yes" : "no"}`);
    console.log("Planned operations:");
    result.plannedOperations.forEach((operation) => {
      console.log(`- ${operation}`);
    });

    if (result.mode === "dry-run") {
      console.log("Dry-run completed. No App Store Connect mutation requests were sent.");
    } else {
      console.log(`Build upload id: ${result.buildUploadId}`);
      console.log(`Final state: ${result.finalBuildUploadState}`);
    }
  }

  return 0;
}

async function resolveAppReference(
  appsRepository: AppsApiRepository,
  appReference: string
): Promise<AppSummary> {
  const apps = await appsRepository.listApps();
  const exactMatch = apps.find(
    (app) => app.id === appReference || app.bundleId === appReference
  );

  if (!exactMatch) {
    throw new Error(`Could not resolve app reference "${appReference}".`);
  }

  return exactMatch;
}

function createIpaArtifactProvider(processRunner: NodeProcessRunner): DefaultIpaArtifactProvider {
  return new DefaultIpaArtifactProvider(
    new PrebuiltIpaArtifactProvider(),
    new XcodebuildIpaArtifactProvider(processRunner),
    new CustomCommandIpaArtifactProvider(processRunner)
  );
}

function assertNever(value: never): never {
  throw new Error(`Unsupported command payload: ${JSON.stringify(value)}`);
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
