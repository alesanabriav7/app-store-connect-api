import type { UploadOperation } from "../services/upload-operations-executor.js";

export interface CreateBuildUploadInput {
  readonly appId: string;
  readonly versionString: string;
  readonly buildNumber: string;
  readonly platform: "IOS";
}

export interface BuildUploadStateDetails {
  readonly state: string;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly infos: readonly string[];
}

export interface BuildUploadSummary {
  readonly id: string;
  readonly state: BuildUploadStateDetails;
}

export interface CreateBuildUploadFileInput {
  readonly buildUploadId: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly uti: "com.apple.ipa";
  readonly assetType: "ASSET";
}

export interface BuildUploadFileSummary {
  readonly id: string;
  readonly uploadOperations: readonly UploadOperation[];
}

export interface MarkBuildUploadFileUploadedInput {
  readonly buildUploadFileId: string;
  readonly sha256: string;
  readonly md5: string;
}

export interface BuildUploadsRepository {
  createBuildUpload(input: CreateBuildUploadInput): Promise<BuildUploadSummary>;
  createBuildUploadFile(input: CreateBuildUploadFileInput): Promise<BuildUploadFileSummary>;
  markBuildUploadFileUploaded(input: MarkBuildUploadFileUploadedInput): Promise<void>;
  getBuildUpload(buildUploadId: string): Promise<BuildUploadSummary>;
}
