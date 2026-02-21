import { createVerify, generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "vitest";

import type { Clock } from "../../src/core/clock.js";
import { InfrastructureError } from "../../src/core/errors.js";
import { AppStoreConnectJwtTokenProvider } from "../../src/data/auth/app-store-connect-jwt-token-provider.js";

class MutableClock implements Clock {
  public constructor(private epochSeconds: number) {}

  public now(): Date {
    return new Date(this.epochSeconds * 1000);
  }

  public advanceBy(seconds: number): void {
    this.epochSeconds += seconds;
  }
}

function decodeJwtPart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

function splitJwtToken(token: string): [string, string, string] {
  const [headerPart, payloadPart, signaturePart] = token.split(".");

  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error("Invalid JWT format.");
  }

  return [headerPart, payloadPart, signaturePart];
}

describe("AppStoreConnectJwtTokenProvider", () => {
  const privateKeyPem = generateKeyPairSync("ec", {
    namedCurve: "P-256",
    privateKeyEncoding: { format: "pem", type: "pkcs8" },
    publicKeyEncoding: { format: "pem", type: "spki" }
  });

  it("creates a valid ES256 JWT with expected claims", async () => {
    const clock = new MutableClock(1_700_000_000);
    const provider = new AppStoreConnectJwtTokenProvider(
      {
        issuerId: "issuer-id",
        keyId: "ABC123DEFG",
        privateKey: privateKeyPem.privateKey,
        audience: "appstoreconnect-v1",
        scope: ["GET /v1/apps"]
      },
      clock
    );

    const token = await provider.getToken();
    const [headerPart, payloadPart, signaturePart] = splitJwtToken(token);

    const header = decodeJwtPart<{ alg: string; kid: string; typ: string }>(
      headerPart
    );
    const payload = decodeJwtPart<{
      iss: string;
      iat: number;
      exp: number;
      aud: string;
      scope?: string[];
    }>(payloadPart);

    expect(header).toEqual({
      alg: "ES256",
      kid: "ABC123DEFG",
      typ: "JWT"
    });
    expect(payload.iss).toBe("issuer-id");
    expect(payload.aud).toBe("appstoreconnect-v1");
    expect(payload.exp - payload.iat).toBe(1200);
    expect(payload.scope).toEqual(["GET /v1/apps"]);

    const verifier = createVerify("SHA256");
    verifier.update(`${headerPart}.${payloadPart}`);
    verifier.end();

    const isValidSignature = verifier.verify(
      {
        key: privateKeyPem.publicKey,
        dsaEncoding: "ieee-p1363"
      },
      Buffer.from(signaturePart, "base64url")
    );

    expect(isValidSignature).toBe(true);
  });

  it("returns cached token until refresh window", async () => {
    const clock = new MutableClock(1_000);
    const provider = new AppStoreConnectJwtTokenProvider(
      {
        issuerId: "issuer-id",
        keyId: "ABC123DEFG",
        privateKey: privateKeyPem.privateKey
      },
      clock
    );

    const firstToken = await provider.getToken();

    clock.advanceBy(120);
    const secondToken = await provider.getToken();

    clock.advanceBy(1_051);
    const thirdToken = await provider.getToken();

    expect(secondToken).toBe(firstToken);
    expect(thirdToken).not.toBe(firstToken);
  });

  it("throws when token ttl is invalid", () => {
    expect(
      () =>
        new AppStoreConnectJwtTokenProvider({
          issuerId: "issuer-id",
          keyId: "ABC123DEFG",
          privateKey: privateKeyPem.privateKey,
          tokenTtlSeconds: 1_201
        })
    ).toThrowError(InfrastructureError);
  });
});
