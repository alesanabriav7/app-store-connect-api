import { access, constants, copyFile, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { InfrastructureError } from "../../core/errors.js";
import type { ProcessRunner } from "../../core/process-runner.js";
import type {
  IpaArtifact,
  IpaArtifactProvider,
  IpaSource,
  XcodebuildIpaSource
} from "../../domain/services/ipa-artifact-provider.js";

const DEFAULT_CONFIGURATION = "Release";

export class XcodebuildIpaArtifactProvider implements IpaArtifactProvider {
  public constructor(private readonly processRunner: ProcessRunner) {}

  public async resolve(source: IpaSource): Promise<IpaArtifact> {
    if (source.kind !== "xcodebuild") {
      throw new InfrastructureError(
        `XcodebuildIpaArtifactProvider cannot handle source kind "${source.kind}".`
      );
    }

    return this.resolveXcodebuild(source);
  }

  private async resolveXcodebuild(source: XcodebuildIpaSource): Promise<IpaArtifact> {
    if (!source.scheme.trim()) {
      throw new InfrastructureError("scheme is required for xcodebuild IPA source.");
    }

    if (!source.exportOptionsPlist.trim()) {
      throw new InfrastructureError(
        "exportOptionsPlist is required for xcodebuild IPA source."
      );
    }

    const hasWorkspace = Boolean(source.workspacePath);
    const hasProject = Boolean(source.projectPath);

    if (hasWorkspace === hasProject) {
      throw new InfrastructureError(
        "Exactly one of workspacePath or projectPath must be provided."
      );
    }

    const createdTemporaryDirectories: string[] = [];
    const rootTemporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "asc-build-"));
    createdTemporaryDirectories.push(rootTemporaryDirectory);

    const archivePath = source.archivePath
      ? path.resolve(source.archivePath)
      : path.join(rootTemporaryDirectory, "archive.xcarchive");
    const exportDirectory = path.join(rootTemporaryDirectory, "export");

    const exportOptionsPlist = path.resolve(source.exportOptionsPlist);
    await access(exportOptionsPlist, constants.R_OK).catch((error: unknown) => {
      throw new InfrastructureError(
        `Export options plist is not readable: ${exportOptionsPlist}`,
        error
      );
    });

    const archiveArgs = this.createArchiveArgs(source, archivePath);
    await this.processRunner.run("xcodebuild", archiveArgs);

    await mkdir(exportDirectory, { recursive: true });

    const exportArgs = [
      "-exportArchive",
      "-archivePath",
      archivePath,
      "-exportOptionsPlist",
      exportOptionsPlist,
      "-exportPath",
      exportDirectory
    ];
    await this.processRunner.run("xcodebuild", exportArgs);

    const exportedIpaPath = await this.findIpaInDirectory(exportDirectory);

    if (!source.outputIpaPath) {
      return {
        ipaPath: exportedIpaPath,
        dispose: async () => {
          await this.cleanup(createdTemporaryDirectories);
        }
      };
    }

    const outputIpaPath = path.resolve(source.outputIpaPath);
    await mkdir(path.dirname(outputIpaPath), { recursive: true });
    await copyFile(exportedIpaPath, outputIpaPath);
    await this.cleanup(createdTemporaryDirectories);

    return {
      ipaPath: outputIpaPath
    };
  }

  private createArchiveArgs(source: XcodebuildIpaSource, archivePath: string): string[] {
    const args = [
      "archive",
      "-scheme",
      source.scheme,
      "-configuration",
      source.configuration ?? DEFAULT_CONFIGURATION,
      "-archivePath",
      archivePath
    ];

    if (source.workspacePath) {
      args.push("-workspace", path.resolve(source.workspacePath));
    }

    if (source.projectPath) {
      args.push("-project", path.resolve(source.projectPath));
    }

    if (source.derivedDataPath) {
      args.push("-derivedDataPath", path.resolve(source.derivedDataPath));
    }

    return args;
  }

  private async findIpaInDirectory(directoryPath: string): Promise<string> {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    const ipaEntry = entries.find((entry) => entry.isFile() && entry.name.endsWith(".ipa"));

    if (!ipaEntry) {
      throw new InfrastructureError(
        `xcodebuild export did not produce an .ipa file in: ${directoryPath}`
      );
    }

    return path.join(directoryPath, ipaEntry.name);
  }

  private async cleanup(paths: readonly string[]): Promise<void> {
    for (const pathToRemove of paths) {
      await rm(pathToRemove, { recursive: true, force: true });
    }
  }
}
