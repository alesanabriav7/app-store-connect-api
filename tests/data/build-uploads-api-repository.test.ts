import { describe, expect, it } from "vitest";

import { BuildUploadsApiRepository } from "../../src/data/builds/build-uploads-api-repository.js";
import type { HttpClient, HttpRequest, HttpResponse } from "../../src/data/http/http-client.js";

describe("BuildUploadsApiRepository", () => {
  it("maps build upload file upload operations", async () => {
    const requests: HttpRequest[] = [];

    const httpClient: HttpClient = {
      request: async <T>(request: HttpRequest) => {
        requests.push(request);

        return {
          status: 200,
          headers: new Headers(),
          data: {
            data: {
              id: "file-1",
              attributes: {
                uploadOperations: [
                  {
                    method: "PUT",
                    url: "https://example.test/upload",
                    offset: 0,
                    length: 10,
                    requestHeaders: [
                      {
                        name: "Content-Type",
                        value: "application/octet-stream"
                      }
                    ]
                  }
                ]
              }
            }
          }
        } as HttpResponse<T>;
      }
    };

    const repository = new BuildUploadsApiRepository(httpClient);

    const result = await repository.createBuildUploadFile({
      buildUploadId: "upload-1",
      fileName: "Demo.ipa",
      fileSize: 10,
      uti: "com.apple.ipa",
      assetType: "ASSET"
    });

    expect(requests[0]?.path).toBe("/v1/buildUploadFiles");
    expect(result).toEqual({
      id: "file-1",
      uploadOperations: [
        {
          method: "PUT",
          url: "https://example.test/upload",
          offset: 0,
          length: 10,
          requestHeaders: [
            {
              name: "Content-Type",
              value: "application/octet-stream"
            }
          ]
        }
      ]
    });
  });

  it("sends checksums when marking build upload file as uploaded", async () => {
    const requests: HttpRequest[] = [];

    const httpClient: HttpClient = {
      request: async <T>(request: HttpRequest) => {
        requests.push(request);

        return {
          status: 200,
          headers: new Headers(),
          data: {} as T
        };
      }
    };

    const repository = new BuildUploadsApiRepository(httpClient);

    await repository.markBuildUploadFileUploaded({
      buildUploadFileId: "file-1",
      sha256: "sha256",
      md5: "md5"
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]?.path).toBe("/v1/buildUploadFiles/file-1");
    expect(requests[0]?.method).toBe("PATCH");
    expect(requests[0]?.body).toEqual({
      data: {
        type: "buildUploadFiles",
        id: "file-1",
        attributes: {
          sourceFileChecksums: {
            file: {
              hash: "sha256",
              algorithm: "SHA_256"
            },
            composite: {
              hash: "md5",
              algorithm: "MD5"
            }
          },
          uploaded: true
        }
      }
    });
  });
});
