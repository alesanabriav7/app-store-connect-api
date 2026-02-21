export interface VerifyStrictIpaInput {
  readonly ipaPath: string;
  readonly expectedBundleId?: string;
  readonly expectedVersion?: string;
  readonly expectedBuildNumber?: string;
}

export interface IpaPreflightReport {
  readonly ipaPath: string;
  readonly bundleId: string | null;
  readonly version: string | null;
  readonly buildNumber: string | null;
  readonly sizeBytes: number;
  readonly sha256: string | null;
  readonly md5: string | null;
  readonly signingValidated: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface IpaPreflightVerifier {
  verifyStrict(input: VerifyStrictIpaInput): Promise<IpaPreflightReport>;
}
