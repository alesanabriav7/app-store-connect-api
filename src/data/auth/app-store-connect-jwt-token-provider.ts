import { createSign } from "node:crypto";

import { SystemClock, type Clock } from "../../core/clock.js";
import { InfrastructureError } from "../../core/errors.js";
import type {
  AppStoreConnectAuthConfig,
  AppStoreConnectAuthTokenProvider
} from "../../domain/services/app-store-connect-token-provider.js";
import { encodeJsonAsBase64Url } from "./jwt-encoding.js";

interface JwtHeader {
  readonly alg: "ES256";
  readonly kid: string;
  readonly typ: "JWT";
}

interface JwtPayload {
  readonly iss: string;
  readonly iat: number;
  readonly exp: number;
  readonly aud: string;
  readonly scope?: readonly string[];
}

interface CachedToken {
  readonly token: string;
  readonly expiresAtEpochSeconds: number;
}

const MAX_TOKEN_TTL_SECONDS = 1200;
const DEFAULT_TOKEN_TTL_SECONDS = 1200;
const REFRESH_WINDOW_SECONDS = 30;
const DEFAULT_AUDIENCE = "appstoreconnect-v1";

export class AppStoreConnectJwtTokenProvider implements AppStoreConnectAuthTokenProvider {
  private cachedToken: CachedToken | null = null;

  public constructor(
    private readonly config: AppStoreConnectAuthConfig,
    private readonly clock: Clock = new SystemClock()
  ) {
    this.assertValidConfig(config);
  }

  public async getToken(): Promise<string> {
    const nowEpochSeconds = this.currentEpochSeconds();

    if (
      this.cachedToken &&
      nowEpochSeconds < this.cachedToken.expiresAtEpochSeconds - REFRESH_WINDOW_SECONDS
    ) {
      return this.cachedToken.token;
    }

    const payload = this.buildPayload(nowEpochSeconds);
    const header: JwtHeader = {
      alg: "ES256",
      kid: this.config.keyId,
      typ: "JWT"
    };

    const encodedHeader = encodeJsonAsBase64Url(header);
    const encodedPayload = encodeJsonAsBase64Url(payload);
    const signaturePayload = `${encodedHeader}.${encodedPayload}`;
    const signature = this.sign(signaturePayload);
    const token = `${signaturePayload}.${signature}`;

    this.cachedToken = {
      token,
      expiresAtEpochSeconds: payload.exp
    };

    return token;
  }

  private buildPayload(nowEpochSeconds: number): JwtPayload {
    const ttlSeconds = this.config.tokenTtlSeconds ?? DEFAULT_TOKEN_TTL_SECONDS;

    const payload: JwtPayload = {
      iss: this.config.issuerId,
      iat: nowEpochSeconds,
      exp: nowEpochSeconds + ttlSeconds,
      aud: this.config.audience ?? DEFAULT_AUDIENCE
    };

    if (this.config.scope && this.config.scope.length > 0) {
      return {
        ...payload,
        scope: this.config.scope
      };
    }

    return payload;
  }

  private sign(payload: string): string {
    try {
      const signer = createSign("SHA256");
      signer.update(payload);
      signer.end();

      return signer
        .sign({ key: this.config.privateKey, dsaEncoding: "ieee-p1363" })
        .toString("base64url");
    } catch (error) {
      throw new InfrastructureError(
        "Failed to sign App Store Connect JWT token.",
        error
      );
    }
  }

  private currentEpochSeconds(): number {
    return Math.floor(this.clock.now().getTime() / 1000);
  }

  private assertValidConfig(config: AppStoreConnectAuthConfig): void {
    if (!config.issuerId.trim()) {
      throw new InfrastructureError("issuerId is required.");
    }

    if (!config.keyId.trim()) {
      throw new InfrastructureError("keyId is required.");
    }

    if (!config.privateKey.trim()) {
      throw new InfrastructureError("privateKey is required.");
    }

    const ttl = config.tokenTtlSeconds ?? DEFAULT_TOKEN_TTL_SECONDS;

    if (ttl <= 0 || ttl > MAX_TOKEN_TTL_SECONDS) {
      throw new InfrastructureError(
        `tokenTtlSeconds must be between 1 and ${MAX_TOKEN_TTL_SECONDS}.`
      );
    }
  }
}
