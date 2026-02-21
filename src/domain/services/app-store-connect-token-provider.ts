export interface AppStoreConnectAuthConfig {
  readonly issuerId: string;
  readonly keyId: string;
  readonly privateKey: string;
  readonly audience?: string;
  readonly scope?: readonly string[];
  readonly tokenTtlSeconds?: number;
}

export interface AppStoreConnectAuthTokenProvider {
  getToken(): Promise<string>;
}
