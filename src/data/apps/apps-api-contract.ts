export interface AppStoreConnectListAppsResponse {
  readonly data: readonly {
    readonly id: string;
    readonly attributes: {
      readonly name: string;
      readonly bundleId: string;
      readonly sku?: string;
    };
  }[];
}
