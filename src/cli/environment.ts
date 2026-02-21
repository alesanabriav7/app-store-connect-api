import { InfrastructureError } from "../core/errors.js";

export interface CliEnvironment {
  readonly issuerId: string;
  readonly keyId: string;
  readonly privateKey: string;
  readonly baseUrl: string;
}

const DEFAULT_BASE_URL = "https://api.appstoreconnect.apple.com/";

export function resolveCliEnvironment(env: NodeJS.ProcessEnv): CliEnvironment {
  const issuerId = env.ASC_ISSUER_ID?.trim();
  const keyId = env.ASC_KEY_ID?.trim();
  const privateKeyRaw = env.ASC_PRIVATE_KEY?.trim();
  const baseUrl = env.ASC_BASE_URL?.trim() || DEFAULT_BASE_URL;

  const missingKeys: string[] = [];

  if (!issuerId) {
    missingKeys.push("ASC_ISSUER_ID");
  }

  if (!keyId) {
    missingKeys.push("ASC_KEY_ID");
  }

  if (!privateKeyRaw) {
    missingKeys.push("ASC_PRIVATE_KEY");
  }

  if (missingKeys.length > 0) {
    throw new InfrastructureError(
      `Missing required environment variables: ${missingKeys.join(", ")}`
    );
  }

  return {
    issuerId: issuerId!,
    keyId: keyId!,
    privateKey: normalizePrivateKey(privateKeyRaw!),
    baseUrl
  };
}

function normalizePrivateKey(rawValue: string): string {
  return rawValue.includes("\\n") ? rawValue.replace(/\\n/g, "\n") : rawValue;
}
