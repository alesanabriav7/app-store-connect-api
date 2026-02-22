export interface AppStoreConnectAppInfoLocalizationResource {
  readonly id?: string;
  readonly attributes?: {
    readonly locale?: string;
    readonly name?: string;
    readonly subtitle?: string;
  };
}

export interface AppStoreConnectAppStoreVersionLocalizationResource {
  readonly id?: string;
  readonly attributes?: {
    readonly locale?: string;
    readonly description?: string;
    readonly keywords?: string;
  };
}

export interface AppStoreConnectListAppInfoLocalizationsResponse {
  readonly data: readonly AppStoreConnectAppInfoLocalizationResource[];
}

export interface AppStoreConnectAppInfoLocalizationResponse {
  readonly data: AppStoreConnectAppInfoLocalizationResource;
}

export interface AppStoreConnectListAppStoreVersionLocalizationsResponse {
  readonly data: readonly AppStoreConnectAppStoreVersionLocalizationResource[];
}

export interface AppStoreConnectAppStoreVersionLocalizationResponse {
  readonly data: AppStoreConnectAppStoreVersionLocalizationResource;
}
