import { InfrastructureError } from "../../core/errors.js";
import type {
  IpaArtifact,
  IpaArtifactProvider,
  IpaSource
} from "../../domain/services/ipa-artifact-provider.js";

export class DefaultIpaArtifactProvider implements IpaArtifactProvider {
  public constructor(
    private readonly prebuiltProvider: IpaArtifactProvider,
    private readonly xcodebuildProvider: IpaArtifactProvider,
    private readonly customCommandProvider: IpaArtifactProvider
  ) {}

  public async resolve(source: IpaSource): Promise<IpaArtifact> {
    switch (source.kind) {
      case "prebuilt":
        return this.prebuiltProvider.resolve(source);
      case "xcodebuild":
        return this.xcodebuildProvider.resolve(source);
      case "customCommand":
        return this.customCommandProvider.resolve(source);
      default:
        throw new InfrastructureError(`Unsupported IPA source kind: ${String(source)}`);
    }
  }
}
