export interface PrebuiltIpaSource {
  readonly kind: "prebuilt";
  readonly ipaPath: string;
}

export interface XcodebuildIpaSource {
  readonly kind: "xcodebuild";
  readonly scheme: string;
  readonly exportOptionsPlist: string;
  readonly workspacePath?: string;
  readonly projectPath?: string;
  readonly configuration?: string;
  readonly archivePath?: string;
  readonly derivedDataPath?: string;
  readonly outputIpaPath?: string;
}

export interface CustomCommandIpaSource {
  readonly kind: "customCommand";
  readonly buildCommand: string;
  readonly generatedIpaPath: string;
  readonly outputIpaPath?: string;
}

export type IpaSource = PrebuiltIpaSource | XcodebuildIpaSource | CustomCommandIpaSource;

export interface IpaArtifact {
  readonly ipaPath: string;
  readonly dispose?: () => Promise<void>;
}

export interface IpaArtifactProvider {
  resolve(source: IpaSource): Promise<IpaArtifact>;
}
