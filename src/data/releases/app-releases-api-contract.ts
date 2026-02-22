export interface AppStoreConnectAppStoreVersionResource {
  readonly id?: string;
  readonly attributes?: {
    readonly versionString?: string;
    readonly platform?: string;
    readonly appStoreState?: string;
    readonly releaseType?: string;
    readonly earliestReleaseDate?: string;
  };
}

export interface AppStoreConnectAppStoreVersionPhasedReleaseResource {
  readonly id?: string;
  readonly attributes?: {
    readonly phasedReleaseState?: string;
    readonly currentDayNumber?: number;
    readonly startDate?: string;
  };
}

export interface AppStoreConnectAppStoreVersionSubmissionResource {
  readonly id?: string;
}

export interface AppStoreConnectListAppStoreVersionsResponse {
  readonly data: readonly AppStoreConnectAppStoreVersionResource[];
}

export interface AppStoreConnectAppStoreVersionResponse {
  readonly data: AppStoreConnectAppStoreVersionResource;
}

export interface AppStoreConnectAppStoreVersionPhasedReleaseResponse {
  readonly data: AppStoreConnectAppStoreVersionPhasedReleaseResource;
}

export interface AppStoreConnectAppStoreVersionSubmissionResponse {
  readonly data: AppStoreConnectAppStoreVersionSubmissionResource;
}
