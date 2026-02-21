import { writeFile, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { InfrastructureError } from "../../src/core/errors.js";
import type { ProcessRunner } from "../../src/core/process-runner.js";
import { StrictIpaPreflightVerifier } from "../../src/data/local/strict-ipa-preflight-verifier.js";

describe("StrictIpaPreflightVerifier", () => {
  it("returns a clean preflight report for valid metadata/signing", async () => {
    const ipaPath = path.join(os.tmpdir(), `preflight-valid-${Date.now()}.ipa`);
    await writeFile(ipaPath, "dummy ipa bytes");

    const verifier = new StrictIpaPreflightVerifier(
      createProcessRunner({
        plistJson: {
          CFBundleIdentifier: "com.example.demo",
          CFBundleShortVersionString: "1.0.0",
          CFBundleVersion: "42"
        }
      })
    );

    const report = await verifier.verifyStrict({
      ipaPath,
      expectedBundleId: "com.example.demo",
      expectedVersion: "1.0.0",
      expectedBuildNumber: "42"
    });

    expect(report.errors).toEqual([]);
    expect(report.signingValidated).toBe(true);
    expect(report.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(report.md5).toMatch(/^[0-9a-f]{32}$/);

    await rm(ipaPath, { force: true });
  });

  it("collects mismatch errors from Info.plist", async () => {
    const ipaPath = path.join(os.tmpdir(), `preflight-mismatch-${Date.now()}.ipa`);
    await writeFile(ipaPath, "dummy ipa bytes");

    const verifier = new StrictIpaPreflightVerifier(
      createProcessRunner({
        plistJson: {
          CFBundleIdentifier: "com.other.app",
          CFBundleShortVersionString: "9.9.9",
          CFBundleVersion: "999"
        }
      })
    );

    const report = await verifier.verifyStrict({
      ipaPath,
      expectedBundleId: "com.example.demo",
      expectedVersion: "1.0.0",
      expectedBuildNumber: "42"
    });

    expect(report.errors.some((line) => line.includes("CFBundleIdentifier mismatch"))).toBe(
      true
    );
    expect(
      report.errors.some((line) => line.includes("CFBundleShortVersionString mismatch"))
    ).toBe(true);
    expect(report.errors.some((line) => line.includes("CFBundleVersion mismatch"))).toBe(true);

    await rm(ipaPath, { force: true });
  });

  it("reports signing failures", async () => {
    const ipaPath = path.join(os.tmpdir(), `preflight-signing-${Date.now()}.ipa`);
    await writeFile(ipaPath, "dummy ipa bytes");

    const verifier = new StrictIpaPreflightVerifier(
      createProcessRunner({
        plistJson: {
          CFBundleIdentifier: "com.example.demo",
          CFBundleShortVersionString: "1.0.0",
          CFBundleVersion: "42"
        },
        failCodesignVerify: true
      })
    );

    const report = await verifier.verifyStrict({
      ipaPath,
      expectedBundleId: "com.example.demo",
      expectedVersion: "1.0.0",
      expectedBuildNumber: "42"
    });

    expect(report.signingValidated).toBe(false);
    expect(report.errors.some((line) => line.toLowerCase().includes("codesign"))).toBe(true);

    await rm(ipaPath, { force: true });
  });
});

function createProcessRunner(options: {
  readonly plistJson: Readonly<Record<string, string>>;
  readonly failCodesignVerify?: boolean;
}): ProcessRunner {
  return {
    run: async (command, args) => {
      if (command === "unzip" && args[0] === "-Z1") {
        return {
          stdout: "Payload/Demo.app/Info.plist\n",
          stderr: ""
        };
      }

      if (command === "unzip") {
        return {
          stdout: "",
          stderr: ""
        };
      }

      if (command === "plutil") {
        return {
          stdout: JSON.stringify(options.plistJson),
          stderr: ""
        };
      }

      if (command === "codesign" && args[0] === "--verify" && options.failCodesignVerify) {
        throw new InfrastructureError("codesign verification failed");
      }

      if (command === "codesign") {
        return {
          stdout: "",
          stderr: ""
        };
      }

      throw new InfrastructureError(`Unexpected command in test double: ${command}`);
    }
  };
}
