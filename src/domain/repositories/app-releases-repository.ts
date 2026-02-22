export type AppStoreVersionPlatform = "IOS";
export type AppStoreVersionReleaseType = "MANUAL" | "AFTER_APPROVAL" | "SCHEDULED";
export type AppStoreVersionPhasedReleaseState =
  | "INACTIVE"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETE";

export interface AppStoreVersionSummary {
  readonly id: string;
  readonly versionString: string | null;
  readonly platform: string | null;
  readonly appStoreState: string | null;
  readonly releaseType: string | null;
  readonly earliestReleaseDate: string | null;
}

export interface CreateAppStoreVersionInput {
  readonly appId: string;
  readonly versionString: string;
  readonly platform: AppStoreVersionPlatform;
  readonly releaseType?: AppStoreVersionReleaseType;
}

export interface UpdateAppStoreVersionInput {
  readonly appStoreVersionId: string;
  readonly releaseType?: AppStoreVersionReleaseType;
  readonly earliestReleaseDate?: string;
}

export interface AppStoreVersionPhasedReleaseSummary {
  readonly id: string;
  readonly phasedReleaseState: string;
  readonly currentDayNumber: number | null;
  readonly startDate: string | null;
}

export interface CreateAppStoreVersionPhasedReleaseInput {
  readonly appStoreVersionId: string;
  readonly phasedReleaseState: AppStoreVersionPhasedReleaseState;
}

export interface UpdateAppStoreVersionPhasedReleaseInput {
  readonly appStoreVersionPhasedReleaseId: string;
  readonly phasedReleaseState: AppStoreVersionPhasedReleaseState;
}

export interface AppStoreVersionSubmissionSummary {
  readonly id: string;
}

export interface AppReleasesRepository {
  listAppStoreVersions(appId: string): Promise<readonly AppStoreVersionSummary[]>;
  createAppStoreVersion(input: CreateAppStoreVersionInput): Promise<AppStoreVersionSummary>;
  updateAppStoreVersion(input: UpdateAppStoreVersionInput): Promise<AppStoreVersionSummary>;
  submitAppStoreVersionForReview(
    appStoreVersionId: string
  ): Promise<AppStoreVersionSubmissionSummary>;
  createPhasedRelease(
    input: CreateAppStoreVersionPhasedReleaseInput
  ): Promise<AppStoreVersionPhasedReleaseSummary>;
  updatePhasedRelease(
    input: UpdateAppStoreVersionPhasedReleaseInput
  ): Promise<AppStoreVersionPhasedReleaseSummary>;
}
