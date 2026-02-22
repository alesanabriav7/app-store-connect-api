import { writeFile, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { uploadBuild } from "../../src/commands/builds-upload.js";
import {
  DomainError,
  InfrastructureError,
  type AppStoreConnectClient,
  type HttpRequest,
  type HttpResponse
} from "../../src/api/client.js";
import type { ProcessRunner } from "../../src/ipa/artifact.js";

function createProcessRunner(plistJson: Readonly<Record<string, string>>): ProcessRunner {
  return {
    run: async (command, args) => {
      if (command === "unzip" && args[0] === "-Z1") {
        return { stdout: "Payload/Demo.app/Info.plist\n", stderr: "" };
      }
      if (command === "unzip") {
        return { stdout: "", stderr: "" };
      }
      if (command === "plutil") {
        return { stdout: JSON.stringify(plistJson), stderr: "" };
      }
      if (command === "codesign") {
        return { stdout: "", stderr: "" };
      }
      throw new InfrastructureError(`Unexpected command in test: ${command}`);
    }
  };
}

function createMockClient(): {
  client: AppStoreConnectClient;
  requests: HttpRequest[];
} {
  const requests: HttpRequest[] = [];
  let getBuildUploadCalls = 0;

  const client = {
    request: async <T>(request: HttpRequest) => {
      requests.push(request);

      if (request.method === "POST" && request.path === "/v1/buildUploads") {
        return {
          status: 201,
          headers: new Headers(),
          data: {
            data: {
              id: "upload-1",
              attributes: {
                state: {
                  state: "AWAITING_UPLOAD",
                  errors: [],
                  warnings: [],
                  infos: []
                }
              }
            }
          }
        } as HttpResponse<T>;
      }

      if (request.method === "POST" && request.path === "/v1/buildUploadFiles") {
        return {
          status: 201,
          headers: new Headers(),
          data: {
            data: {
              id: "file-1",
              attributes: { uploadOperations: [] }
            }
          }
        } as HttpResponse<T>;
      }

      if (request.method === "PATCH" && request.path.startsWith("/v1/buildUploadFiles/")) {
        return { status: 200, headers: new Headers(), data: {} as T };
      }

      if (request.method === "GET" && request.path.startsWith("/v1/buildUploads/")) {
        getBuildUploadCalls += 1;
        return {
          status: 200,
          headers: new Headers(),
          data: {
            data: {
              id: "upload-1",
              attributes: {
                state: {
                  state: getBuildUploadCalls < 2 ? "PROCESSING" : "COMPLETE",
                  errors: [],
                  warnings: [],
                  infos: []
                }
              }
            }
          }
        } as HttpResponse<T>;
      }

      throw new Error(`Unexpected request: ${request.method} ${request.path}`);
    },
    getToken: async () => "test-token"
  } as unknown as AppStoreConnectClient;

  return { client, requests };
}

describe("uploadBuild", () => {
  it("returns dry-run result without mutations", async () => {
    const ipaPath = path.join(os.tmpdir(), `upload-dry-${Date.now()}.ipa`);
    await writeFile(ipaPath, "dummy ipa bytes");

    try {
      const { client, requests } = createMockClient();

      const result = await uploadBuild(
        client,
        {
          ipaSource: { kind: "prebuilt", ipaPath },
          appId: "app-1",
          expectedBundleId: "com.example.demo",
          expectedVersion: "1.0.0",
          expectedBuildNumber: "42",
          waitProcessing: false,
          apply: false
        },
        {
          processRunner: createProcessRunner({
            CFBundleIdentifier: "com.example.demo",
            CFBundleShortVersionString: "1.0.0",
            CFBundleVersion: "42"
          })
        }
      );

      expect(result.mode).toBe("dry-run");
      expect(result.buildUploadId).toBeNull();
      expect(result.finalBuildUploadState).toBeNull();
      const mutationRequests = requests.filter(
        (r) => r.method === "POST" && r.path.includes("buildUpload")
      );
      expect(mutationRequests).toHaveLength(0);
    } finally {
      await rm(ipaPath, { force: true });
    }
  });

  it("applies upload flow and polls until complete", async () => {
    const ipaPath = path.join(os.tmpdir(), `upload-apply-${Date.now()}.ipa`);
    await writeFile(ipaPath, "dummy ipa bytes");

    try {
      const { client } = createMockClient();

      const result = await uploadBuild(
        client,
        {
          ipaSource: { kind: "prebuilt", ipaPath },
          appId: "app-1",
          expectedBundleId: "com.example.demo",
          expectedVersion: "1.0.0",
          expectedBuildNumber: "42",
          waitProcessing: true,
          apply: true
        },
        {
          sleep: async () => undefined,
          pollIntervalMs: 1,
          pollTimeoutMs: 100,
          processRunner: createProcessRunner({
            CFBundleIdentifier: "com.example.demo",
            CFBundleShortVersionString: "1.0.0",
            CFBundleVersion: "42"
          })
        }
      );

      expect(result.mode).toBe("applied");
      expect(result.buildUploadId).toBe("upload-1");
      expect(result.finalBuildUploadState).toBe("COMPLETE");
    } finally {
      await rm(ipaPath, { force: true });
    }
  });

  it("fails when preflight report contains errors", async () => {
    const ipaPath = path.join(os.tmpdir(), `upload-fail-${Date.now()}.ipa`);
    await writeFile(ipaPath, "dummy ipa bytes");

    try {
      const { client } = createMockClient();

      await expect(
        uploadBuild(
          client,
          {
            ipaSource: { kind: "prebuilt", ipaPath },
            appId: "app-1",
            expectedBundleId: "com.example.WRONG",
            expectedVersion: "1.0.0",
            expectedBuildNumber: "42",
            waitProcessing: false,
            apply: true
          },
          {
            processRunner: createProcessRunner({
              CFBundleIdentifier: "com.example.demo",
              CFBundleShortVersionString: "1.0.0",
              CFBundleVersion: "42"
            })
          }
        )
      ).rejects.toThrowError(DomainError);
    } finally {
      await rm(ipaPath, { force: true });
    }
  });
});
