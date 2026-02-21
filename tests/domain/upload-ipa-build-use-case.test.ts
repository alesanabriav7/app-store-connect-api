import { describe, expect, it } from "vitest";

import { DomainError } from "../../src/core/errors.js";
import type { BuildUploadsRepository } from "../../src/domain/repositories/build-uploads-repository.js";
import type { IpaArtifactProvider } from "../../src/domain/services/ipa-artifact-provider.js";
import type { IpaPreflightVerifier } from "../../src/domain/services/ipa-preflight-verifier.js";
import type { UploadOperationsExecutor } from "../../src/domain/services/upload-operations-executor.js";
import { UploadIpaBuildUseCase } from "../../src/domain/use-cases/upload-ipa-build-use-case.js";

describe("UploadIpaBuildUseCase", () => {
  it("returns dry-run result and does not call mutation dependencies", async () => {
    let uploadExecutorCalls = 0;
    let createBuildUploadCalls = 0;
    let createBuildUploadFileCalls = 0;
    let markUploadedCalls = 0;

    const useCase = new UploadIpaBuildUseCase({
      artifactProvider: {
        resolve: async () => ({
          ipaPath: "/tmp/Test.ipa"
        })
      } satisfies IpaArtifactProvider,
      preflightVerifier: {
        verifyStrict: async () => ({
          ipaPath: "/tmp/Test.ipa",
          bundleId: "com.example.demo",
          version: "1.0.0",
          buildNumber: "42",
          sizeBytes: 1024,
          sha256: "abc",
          md5: "def",
          signingValidated: true,
          errors: [],
          warnings: []
        })
      } satisfies IpaPreflightVerifier,
      buildUploadsRepository: {
        createBuildUpload: async () => {
          createBuildUploadCalls += 1;
          throw new Error("not expected");
        },
        createBuildUploadFile: async () => {
          createBuildUploadFileCalls += 1;
          throw new Error("not expected");
        },
        markBuildUploadFileUploaded: async () => {
          markUploadedCalls += 1;
          throw new Error("not expected");
        },
        getBuildUpload: async () => {
          throw new Error("not expected");
        }
      } satisfies BuildUploadsRepository,
      uploadOperationsExecutor: {
        execute: async () => {
          uploadExecutorCalls += 1;
        }
      } satisfies UploadOperationsExecutor,
      sleep: async () => undefined
    });

    const result = await useCase.execute({
      ipaSource: {
        kind: "prebuilt",
        ipaPath: "/tmp/Test.ipa"
      },
      appId: "123",
      expectedBundleId: "com.example.demo",
      expectedVersion: "1.0.0",
      expectedBuildNumber: "42",
      verificationMode: "strict",
      waitProcessing: false,
      apply: false
    });

    expect(result.mode).toBe("dry-run");
    expect(result.buildUploadId).toBeNull();
    expect(result.finalBuildUploadState).toBeNull();
    expect(uploadExecutorCalls).toBe(0);
    expect(createBuildUploadCalls).toBe(0);
    expect(createBuildUploadFileCalls).toBe(0);
    expect(markUploadedCalls).toBe(0);
  });

  it("applies upload flow and polls until complete", async () => {
    let createBuildUploadCalls = 0;
    let createBuildUploadFileCalls = 0;
    let markUploadedCalls = 0;
    let uploadExecutorCalls = 0;
    let getBuildUploadCalls = 0;

    const useCase = new UploadIpaBuildUseCase({
      artifactProvider: {
        resolve: async () => ({
          ipaPath: "/tmp/Test.ipa"
        })
      } satisfies IpaArtifactProvider,
      preflightVerifier: {
        verifyStrict: async () => ({
          ipaPath: "/tmp/Test.ipa",
          bundleId: "com.example.demo",
          version: "1.0.0",
          buildNumber: "42",
          sizeBytes: 2048,
          sha256: "sha256-value",
          md5: "md5-value",
          signingValidated: true,
          errors: [],
          warnings: []
        })
      } satisfies IpaPreflightVerifier,
      buildUploadsRepository: {
        createBuildUpload: async () => {
          createBuildUploadCalls += 1;
          return {
            id: "upload-1",
            state: {
              state: "AWAITING_UPLOAD",
              errors: [],
              warnings: [],
              infos: []
            }
          };
        },
        createBuildUploadFile: async () => {
          createBuildUploadFileCalls += 1;
          return {
            id: "file-1",
            uploadOperations: []
          };
        },
        markBuildUploadFileUploaded: async () => {
          markUploadedCalls += 1;
        },
        getBuildUpload: async () => {
          getBuildUploadCalls += 1;
          return {
            id: "upload-1",
            state: {
              state: getBuildUploadCalls < 2 ? "PROCESSING" : "COMPLETE",
              errors: [],
              warnings: [],
              infos: []
            }
          };
        }
      } satisfies BuildUploadsRepository,
      uploadOperationsExecutor: {
        execute: async () => {
          uploadExecutorCalls += 1;
        }
      } satisfies UploadOperationsExecutor,
      sleep: async () => undefined,
      pollIntervalMs: 1,
      pollTimeoutMs: 100
    });

    const result = await useCase.execute({
      ipaSource: {
        kind: "prebuilt",
        ipaPath: "/tmp/Test.ipa"
      },
      appId: "123",
      expectedBundleId: "com.example.demo",
      expectedVersion: "1.0.0",
      expectedBuildNumber: "42",
      verificationMode: "strict",
      waitProcessing: true,
      apply: true
    });

    expect(result.mode).toBe("applied");
    expect(result.buildUploadId).toBe("upload-1");
    expect(result.finalBuildUploadState).toBe("COMPLETE");
    expect(createBuildUploadCalls).toBe(1);
    expect(createBuildUploadFileCalls).toBe(1);
    expect(uploadExecutorCalls).toBe(1);
    expect(markUploadedCalls).toBe(1);
    expect(getBuildUploadCalls).toBeGreaterThanOrEqual(2);
  });

  it("fails when preflight report contains errors", async () => {
    const useCase = new UploadIpaBuildUseCase({
      artifactProvider: {
        resolve: async () => ({
          ipaPath: "/tmp/Test.ipa"
        })
      } satisfies IpaArtifactProvider,
      preflightVerifier: {
        verifyStrict: async () => ({
          ipaPath: "/tmp/Test.ipa",
          bundleId: null,
          version: null,
          buildNumber: null,
          sizeBytes: 0,
          sha256: null,
          md5: null,
          signingValidated: false,
          errors: ["Invalid IPA"],
          warnings: []
        })
      } satisfies IpaPreflightVerifier,
      buildUploadsRepository: {
        createBuildUpload: async () => {
          throw new Error("not expected");
        },
        createBuildUploadFile: async () => {
          throw new Error("not expected");
        },
        markBuildUploadFileUploaded: async () => {
          throw new Error("not expected");
        },
        getBuildUpload: async () => {
          throw new Error("not expected");
        }
      } satisfies BuildUploadsRepository,
      uploadOperationsExecutor: {
        execute: async () => undefined
      } satisfies UploadOperationsExecutor,
      sleep: async () => undefined
    });

    await expect(
      useCase.execute({
        ipaSource: {
          kind: "prebuilt",
          ipaPath: "/tmp/Test.ipa"
        },
        appId: "123",
        expectedBundleId: "com.example.demo",
        expectedVersion: "1.0.0",
        expectedBuildNumber: "42",
        verificationMode: "strict",
        waitProcessing: false,
        apply: true
      })
    ).rejects.toThrowError(DomainError);
  });
});
