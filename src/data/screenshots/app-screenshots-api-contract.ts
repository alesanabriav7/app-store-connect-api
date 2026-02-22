export interface AppStoreConnectUploadOperationHeaderPayload {
  readonly name?: string;
  readonly value?: string;
}

export interface AppStoreConnectUploadOperationPayload {
  readonly method?: string;
  readonly url?: string;
  readonly offset?: number;
  readonly length?: number;
  readonly requestHeaders?: readonly AppStoreConnectUploadOperationHeaderPayload[];
}

export interface AppStoreConnectAppScreenshotResource {
  readonly id?: string;
  readonly attributes?: {
    readonly fileName?: string;
    readonly assetDeliveryState?: {
      readonly state?: string;
    };
    readonly uploadOperations?: readonly AppStoreConnectUploadOperationPayload[];
  };
}

export interface AppStoreConnectAppScreenshotSetResource {
  readonly id?: string;
  readonly attributes?: {
    readonly screenshotDisplayType?: string;
  };
  readonly relationships?: {
    readonly appScreenshots?: {
      readonly data?: readonly {
        readonly id?: string;
      }[];
    };
  };
}

export interface AppStoreConnectListAppScreenshotSetsResponse {
  readonly data: readonly AppStoreConnectAppScreenshotSetResource[];
  readonly included?: readonly AppStoreConnectAppScreenshotResource[];
}

export interface AppStoreConnectAppScreenshotSetResponse {
  readonly data: AppStoreConnectAppScreenshotSetResource;
}

export interface AppStoreConnectAppScreenshotResponse {
  readonly data: AppStoreConnectAppScreenshotResource;
}
