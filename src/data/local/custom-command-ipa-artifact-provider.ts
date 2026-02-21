import { access, constants, copyFile, mkdir } from "node:fs/promises";
import * as path from "node:path";

import { InfrastructureError } from "../../core/errors.js";
import type { ProcessRunner } from "../../core/process-runner.js";
import type {
  CustomCommandIpaSource,
  IpaArtifact,
  IpaArtifactProvider,
  IpaSource
} from "../../domain/services/ipa-artifact-provider.js";

export class CustomCommandIpaArtifactProvider implements IpaArtifactProvider {
  public constructor(private readonly processRunner: ProcessRunner) {}

  public async resolve(source: IpaSource): Promise<IpaArtifact> {
    if (source.kind !== "customCommand") {
      throw new InfrastructureError(
        `CustomCommandIpaArtifactProvider cannot handle source kind "${source.kind}".`
      );
    }

    return this.resolveCustomCommand(source);
  }

  private async resolveCustomCommand(source: CustomCommandIpaSource): Promise<IpaArtifact> {
    if (!source.buildCommand.trim()) {
      throw new InfrastructureError("buildCommand is required for custom command IPA source.");
    }

    await this.processRunner.run("zsh", ["-lc", source.buildCommand]);

    const generatedIpaPath = path.resolve(source.generatedIpaPath);
    await access(generatedIpaPath, constants.R_OK).catch((error: unknown) => {
      throw new InfrastructureError(
        `Generated IPA file is not readable: ${generatedIpaPath}`,
        error
      );
    });

    if (!source.outputIpaPath) {
      return {
        ipaPath: generatedIpaPath
      };
    }

    const outputIpaPath = path.resolve(source.outputIpaPath);
    await mkdir(path.dirname(outputIpaPath), { recursive: true });
    await copyFile(generatedIpaPath, outputIpaPath);

    return {
      ipaPath: outputIpaPath
    };
  }
}
