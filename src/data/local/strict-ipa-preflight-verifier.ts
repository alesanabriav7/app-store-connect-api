import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, constants, mkdtemp, rm, stat } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { InfrastructureError } from "../../core/errors.js";
import type { ProcessRunner } from "../../core/process-runner.js";
import type {
  IpaPreflightReport,
  IpaPreflightVerifier,
  VerifyStrictIpaInput
} from "../../domain/services/ipa-preflight-verifier.js";

interface BundleInfo {
  readonly bundleId: string | null;
  readonly version: string | null;
  readonly buildNumber: string | null;
}

interface FileDigests {
  readonly sha256: string;
  readonly md5: string;
}

export class StrictIpaPreflightVerifier implements IpaPreflightVerifier {
  public constructor(private readonly processRunner: ProcessRunner) {}

  public async verifyStrict(input: VerifyStrictIpaInput): Promise<IpaPreflightReport> {
    const ipaPath = path.resolve(input.ipaPath);
    const errors: string[] = [];
    const warnings: string[] = [];

    let sizeBytes = 0;
    let sha256: string | null = null;
    let md5: string | null = null;
    let bundleId: string | null = null;
    let version: string | null = null;
    let buildNumber: string | null = null;
    let signingValidated = false;

    const statResult = await stat(ipaPath).catch(() => null);

    if (!statResult) {
      errors.push(`IPA file does not exist: ${ipaPath}`);
    } else if (!statResult.isFile()) {
      errors.push(`IPA path is not a file: ${ipaPath}`);
    } else {
      sizeBytes = statResult.size;
    }

    await access(ipaPath, constants.R_OK).catch(() => {
      errors.push(`IPA file is not readable: ${ipaPath}`);
    });

    if (!ipaPath.endsWith(".ipa")) {
      errors.push("IPA file must have .ipa extension.");
    }

    if (sizeBytes <= 0) {
      errors.push("IPA file is empty.");
    }

    if (errors.length === 0) {
      try {
        const digests = await this.computeDigests(ipaPath);
        sha256 = digests.sha256;
        md5 = digests.md5;
      } catch (error) {
        errors.push(this.toMessage(error, "Failed to compute IPA checksums."));
      }
    }

    let infoPlistEntryPath: string | null = null;

    if (errors.length === 0) {
      try {
        const zipEntries = await this.listZipEntries(ipaPath);
        infoPlistEntryPath =
          zipEntries.find((entry) => /^Payload\/[^/]+\.app\/Info\.plist$/.test(entry)) ?? null;

        if (!infoPlistEntryPath) {
          errors.push("IPA is missing Payload/*.app/Info.plist.");
        }
      } catch (error) {
        errors.push(this.toMessage(error, "Failed to inspect IPA archive contents."));
      }
    }

    if (infoPlistEntryPath) {
      try {
        const bundleInfo = await this.extractBundleInfo(ipaPath, infoPlistEntryPath);
        bundleId = bundleInfo.bundleId;
        version = bundleInfo.version;
        buildNumber = bundleInfo.buildNumber;
      } catch (error) {
        errors.push(this.toMessage(error, "Failed to read Info.plist from IPA."));
      }
    }

    if (input.expectedBundleId) {
      if (bundleId !== input.expectedBundleId) {
        errors.push(
          `CFBundleIdentifier mismatch. Expected "${input.expectedBundleId}", got "${bundleId ?? "null"}".`
        );
      }
    } else if (!bundleId) {
      errors.push("CFBundleIdentifier is missing in Info.plist.");
    }

    if (input.expectedVersion) {
      if (version !== input.expectedVersion) {
        errors.push(
          `CFBundleShortVersionString mismatch. Expected "${input.expectedVersion}", got "${version ?? "null"}".`
        );
      }
    } else if (!version) {
      errors.push("CFBundleShortVersionString is missing in Info.plist.");
    }

    if (input.expectedBuildNumber) {
      if (buildNumber !== input.expectedBuildNumber) {
        errors.push(
          `CFBundleVersion mismatch. Expected "${input.expectedBuildNumber}", got "${buildNumber ?? "null"}".`
        );
      }
    } else if (!buildNumber) {
      errors.push("CFBundleVersion is missing in Info.plist.");
    }

    if (infoPlistEntryPath) {
      try {
        await this.verifyCodeSigning(ipaPath, infoPlistEntryPath);
        signingValidated = true;
      } catch (error) {
        errors.push(this.toMessage(error, "Code signing verification failed."));
      }
    }

    return {
      ipaPath,
      bundleId,
      version,
      buildNumber,
      sizeBytes,
      sha256,
      md5,
      signingValidated,
      errors,
      warnings
    };
  }

  private async computeDigests(filePath: string): Promise<FileDigests> {
    return new Promise<FileDigests>((resolve, reject) => {
      const sha256Hash = createHash("sha256");
      const md5Hash = createHash("md5");
      const stream = createReadStream(filePath);

      stream.on("data", (chunk: Buffer) => {
        sha256Hash.update(chunk);
        md5Hash.update(chunk);
      });

      stream.on("error", (error) => {
        reject(error);
      });

      stream.on("end", () => {
        resolve({
          sha256: sha256Hash.digest("hex"),
          md5: md5Hash.digest("hex")
        });
      });
    });
  }

  private async listZipEntries(ipaPath: string): Promise<readonly string[]> {
    const output = await this.processRunner.run("unzip", ["-Z1", ipaPath]);
    return output.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  private async extractBundleInfo(
    ipaPath: string,
    infoPlistEntryPath: string
  ): Promise<BundleInfo> {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "asc-ipa-info-"));

    try {
      await this.processRunner.run("unzip", [
        "-q",
        "-o",
        ipaPath,
        infoPlistEntryPath,
        "-d",
        tempDirectory
      ]);

      const infoPlistPath = path.join(tempDirectory, ...infoPlistEntryPath.split("/"));
      const plistJson = await this.processRunner.run("plutil", [
        "-convert",
        "json",
        "-o",
        "-",
        infoPlistPath
      ]);

      const payload = JSON.parse(plistJson.stdout) as Record<string, unknown>;

      return {
        bundleId: this.toNullableString(payload.CFBundleIdentifier),
        version: this.toNullableString(payload.CFBundleShortVersionString),
        buildNumber: this.toNullableString(payload.CFBundleVersion)
      };
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }

  private async verifyCodeSigning(ipaPath: string, infoPlistEntryPath: string): Promise<void> {
    const appDirectoryEntryPath = infoPlistEntryPath.replace(/\/Info\.plist$/, "");
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "asc-ipa-signing-"));

    try {
      await this.processRunner.run("unzip", ["-q", "-o", ipaPath, "Payload/*", "-d", tempDirectory]);
      const appDirectoryPath = path.join(tempDirectory, ...appDirectoryEntryPath.split("/"));

      await this.processRunner.run("codesign", ["--verify", "--strict", "--deep", appDirectoryPath]);
      await this.processRunner.run("codesign", ["-dv", appDirectoryPath]);
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }

  private toNullableString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value : null;
  }

  private toMessage(error: unknown, fallback: string): string {
    if (error instanceof InfrastructureError) {
      return error.message;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}
