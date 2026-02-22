import type { UploadOperation } from "../services/upload-operations-executor.js";

export interface AppScreenshotSummary {
  readonly id: string;
  readonly fileName: string | null;
  readonly assetDeliveryState: string | null;
}

export interface AppScreenshotSetSummary {
  readonly id: string;
  readonly screenshotDisplayType: string;
}

export interface AppScreenshotSetWithScreenshots extends AppScreenshotSetSummary {
  readonly screenshots: readonly AppScreenshotSummary[];
}

export interface CreateAppScreenshotSetInput {
  readonly appStoreVersionLocalizationId: string;
  readonly screenshotDisplayType: string;
}

export interface CreateAppScreenshotInput {
  readonly appScreenshotSetId: string;
  readonly fileName: string;
  readonly fileSize: number;
}

export interface AppScreenshotUploadSummary extends AppScreenshotSummary {
  readonly uploadOperations: readonly UploadOperation[];
}

export interface AppScreenshotsRepository {
  listScreenshotSets(
    appStoreVersionLocalizationId: string
  ): Promise<readonly AppScreenshotSetWithScreenshots[]>;
  createScreenshotSet(input: CreateAppScreenshotSetInput): Promise<AppScreenshotSetSummary>;
  createScreenshot(input: CreateAppScreenshotInput): Promise<AppScreenshotUploadSummary>;
  markScreenshotUploaded(appScreenshotId: string): Promise<void>;
  deleteScreenshot(appScreenshotId: string): Promise<void>;
}
