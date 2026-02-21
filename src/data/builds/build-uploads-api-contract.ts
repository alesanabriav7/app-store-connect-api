export interface AppStoreConnectBuildUploadStateDetail {
  readonly code?: string;
  readonly description?: string;
}

export interface AppStoreConnectBuildUploadState {
  readonly state?: string;
  readonly errors?: readonly AppStoreConnectBuildUploadStateDetail[];
  readonly warnings?: readonly AppStoreConnectBuildUploadStateDetail[];
  readonly infos?: readonly AppStoreConnectBuildUploadStateDetail[];
}

export interface AppStoreConnectBuildUploadResponse {
  readonly data: {
    readonly id?: string;
    readonly attributes?: {
      readonly state?: AppStoreConnectBuildUploadState;
    };
  };
}

export interface AppStoreConnectBuildUploadFileResponse {
  readonly data: {
    readonly id?: string;
    readonly attributes?: {
      readonly uploadOperations?: readonly {
        readonly method?: string;
        readonly url?: string;
        readonly offset?: number;
        readonly length?: number;
        readonly requestHeaders?: readonly {
          readonly name?: string;
          readonly value?: string;
        }[];
      }[];
    };
  };
}
