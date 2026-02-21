import { DomainError } from "../../core/errors.js";
import type { BuildUploadsRepository } from "../repositories/build-uploads-repository.js";
import type {
  IpaArtifactProvider,
  IpaSource
} from "../services/ipa-artifact-provider.js";
import type { IpaPreflightVerifier } from "../services/ipa-preflight-verifier.js";
import type { UploadOperationsExecutor } from "../services/upload-operations-executor.js";

export interface UploadIpaBuildInput {
  readonly ipaSource: IpaSource;
  readonly appId: string;
  readonly expectedBundleId: string;
  readonly expectedVersion: string;
  readonly expectedBuildNumber: string;
  readonly verificationMode: "strict";
  readonly waitProcessing: boolean;
  readonly apply: boolean;
}

export interface UploadIpaBuildResult {
  readonly mode: "dry-run" | "applied";
  readonly preflightReport: {
    readonly ipaPath: string;
    readonly bundleId: string | null;
    readonly version: string | null;
    readonly buildNumber: string | null;
    readonly sizeBytes: number;
    readonly sha256: string | null;
    readonly md5: string | null;
    readonly signingValidated: boolean;
    readonly errors: readonly string[];
    readonly warnings: readonly string[];
  };
  readonly plannedOperations: readonly string[];
  readonly buildUploadId: string | null;
  readonly finalBuildUploadState: string | null;
}

export interface UploadIpaBuildUseCaseDependencies {
  readonly artifactProvider: IpaArtifactProvider;
  readonly preflightVerifier: IpaPreflightVerifier;
  readonly buildUploadsRepository: BuildUploadsRepository;
  readonly uploadOperationsExecutor: UploadOperationsExecutor;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly pollIntervalMs?: number;
  readonly pollTimeoutMs?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 3_000;
const DEFAULT_POLL_TIMEOUT_MS = 10 * 60 * 1_000;

export class UploadIpaBuildUseCase {
  private readonly pollIntervalMs: number;
  private readonly pollTimeoutMs: number;

  public constructor(private readonly dependencies: UploadIpaBuildUseCaseDependencies) {
    this.pollIntervalMs = dependencies.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.pollTimeoutMs = dependencies.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
  }

  public async execute(input: UploadIpaBuildInput): Promise<UploadIpaBuildResult> {
    const artifact = await this.dependencies.artifactProvider.resolve(input.ipaSource);

    try {
      const preflightReport = await this.dependencies.preflightVerifier.verifyStrict({
        ipaPath: artifact.ipaPath,
        expectedBundleId: input.expectedBundleId,
        expectedVersion: input.expectedVersion,
        expectedBuildNumber: input.expectedBuildNumber
      });

      if (preflightReport.errors.length > 0) {
        throw new DomainError(
          `IPA preflight verification failed: ${preflightReport.errors.join(" | ")}`
        );
      }

      const plannedOperations = [
        `Create build upload for app ${input.appId}`,
        `Create build upload file for ${artifact.ipaPath}`,
        "Upload chunks using App Store Connect upload operations",
        "Mark build upload file as uploaded with checksums",
        input.waitProcessing
          ? "Poll build upload until terminal state"
          : "Fetch current build upload state once"
      ] as const;

      if (!input.apply) {
        return {
          mode: "dry-run",
          preflightReport,
          plannedOperations,
          buildUploadId: null,
          finalBuildUploadState: null
        };
      }

      const buildUpload = await this.dependencies.buildUploadsRepository.createBuildUpload({
        appId: input.appId,
        versionString: input.expectedVersion,
        buildNumber: input.expectedBuildNumber,
        platform: "IOS"
      });

      const fileName = artifact.ipaPath.split(/[\\/]/).at(-1) ?? "build.ipa";

      const buildUploadFile =
        await this.dependencies.buildUploadsRepository.createBuildUploadFile({
          buildUploadId: buildUpload.id,
          fileName,
          fileSize: preflightReport.sizeBytes,
          uti: "com.apple.ipa",
          assetType: "ASSET"
        });

      await this.dependencies.uploadOperationsExecutor.execute({
        filePath: artifact.ipaPath,
        operations: buildUploadFile.uploadOperations
      });

      const sha256 = preflightReport.sha256;
      const md5 = preflightReport.md5;

      if (!sha256 || !md5) {
        throw new DomainError(
          "Missing checksums in preflight report; cannot mark build upload file as uploaded."
        );
      }

      await this.dependencies.buildUploadsRepository.markBuildUploadFileUploaded({
        buildUploadFileId: buildUploadFile.id,
        sha256,
        md5
      });

      const finalState = input.waitProcessing
        ? await this.pollBuildUploadState(buildUpload.id)
        : (await this.dependencies.buildUploadsRepository.getBuildUpload(buildUpload.id))
            .state.state;

      if (finalState === "FAILED") {
        throw new DomainError("Build upload failed in App Store Connect.");
      }

      return {
        mode: "applied",
        preflightReport,
        plannedOperations,
        buildUploadId: buildUpload.id,
        finalBuildUploadState: finalState
      };
    } finally {
      if (artifact.dispose) {
        await artifact.dispose();
      }
    }
  }

  private async pollBuildUploadState(buildUploadId: string): Promise<string> {
    const startedAt = Date.now();

    while (true) {
      const buildUpload = await this.dependencies.buildUploadsRepository.getBuildUpload(
        buildUploadId
      );
      const state = buildUpload.state.state;

      if (state === "COMPLETE" || state === "FAILED") {
        return state;
      }

      if (Date.now() - startedAt > this.pollTimeoutMs) {
        throw new DomainError(
          `Timed out while waiting for build upload processing (${buildUploadId}).`
        );
      }

      await this.dependencies.sleep(this.pollIntervalMs);
    }
  }
}
