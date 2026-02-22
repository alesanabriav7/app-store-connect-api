export interface AppInfoLocalizationSummary {
  readonly id: string;
  readonly locale: string;
  readonly name: string | null;
  readonly subtitle: string | null;
}

export interface AppStoreVersionLocalizationSummary {
  readonly id: string;
  readonly locale: string;
  readonly description: string | null;
  readonly keywords: string | null;
}

export interface UpdateAppInfoLocalizationInput {
  readonly appInfoLocalizationId: string;
  readonly name?: string;
  readonly subtitle?: string;
}

export interface UpdateAppStoreVersionLocalizationInput {
  readonly appStoreVersionLocalizationId: string;
  readonly description?: string;
  readonly keywords?: string;
}

export interface AppMetadataRepository {
  listAppInfoLocalizations(appInfoId: string): Promise<readonly AppInfoLocalizationSummary[]>;
  updateAppInfoLocalization(
    input: UpdateAppInfoLocalizationInput
  ): Promise<AppInfoLocalizationSummary>;
  listAppStoreVersionLocalizations(
    appStoreVersionId: string
  ): Promise<readonly AppStoreVersionLocalizationSummary[]>;
  updateAppStoreVersionLocalization(
    input: UpdateAppStoreVersionLocalizationInput
  ): Promise<AppStoreVersionLocalizationSummary>;
}
