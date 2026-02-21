import { describe, expect, it } from "vitest";

import { InfrastructureError } from "../../src/core/errors.js";
import { resolveCliEnvironment } from "../../src/cli/environment.js";

describe("resolveCliEnvironment", () => {
  it("resolves required variables and normalizes escaped newlines", () => {
    const env = resolveCliEnvironment({
      ASC_ISSUER_ID: "issuer",
      ASC_KEY_ID: "key",
      ASC_PRIVATE_KEY: "line-1\\nline-2"
    });

    expect(env.issuerId).toBe("issuer");
    expect(env.keyId).toBe("key");
    expect(env.privateKey).toBe("line-1\nline-2");
    expect(env.baseUrl).toBe("https://api.appstoreconnect.apple.com/");
  });

  it("throws when required values are missing", () => {
    expect(() =>
      resolveCliEnvironment({
        ASC_ISSUER_ID: "issuer"
      })
    ).toThrowError(InfrastructureError);
  });
});
