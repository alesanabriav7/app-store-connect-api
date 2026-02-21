import { access, constants } from "node:fs/promises";
import * as path from "node:path";

import { InfrastructureError } from "../../core/errors.js";
import type {
  IpaArtifact,
  IpaArtifactProvider,
  IpaSource,
  PrebuiltIpaSource
} from "../../domain/services/ipa-artifact-provider.js";

export class PrebuiltIpaArtifactProvider implements IpaArtifactProvider {
  public async resolve(source: IpaSource): Promise<IpaArtifact> {
    if (source.kind !== "prebuilt") {
      throw new InfrastructureError(
        `PrebuiltIpaArtifactProvider cannot handle source kind "${source.kind}".`
      );
    }

    return this.resolvePrebuilt(source);
  }

  private async resolvePrebuilt(source: PrebuiltIpaSource): Promise<IpaArtifact> {
    const ipaPath = path.resolve(source.ipaPath);

    await access(ipaPath, constants.R_OK).catch((error: unknown) => {
      throw new InfrastructureError(`IPA file is not readable: ${ipaPath}`, error);
    });

    return {
      ipaPath
    };
  }
}
