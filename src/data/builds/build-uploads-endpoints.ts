import type {
  CreateBuildUploadFileInput,
  CreateBuildUploadInput,
  MarkBuildUploadFileUploadedInput
} from "../../domain/repositories/build-uploads-repository.js";
import type { HttpRequest } from "../http/http-client.js";

export function createBuildUploadRequest(input: CreateBuildUploadInput): HttpRequest {
  return {
    method: "POST",
    path: "/v1/buildUploads",
    body: {
      data: {
        type: "buildUploads",
        attributes: {
          cfBundleShortVersionString: input.versionString,
          cfBundleVersion: input.buildNumber,
          platform: input.platform
        },
        relationships: {
          app: {
            data: {
              type: "apps",
              id: input.appId
            }
          }
        }
      }
    }
  };
}

export function createBuildUploadFileRequest(input: CreateBuildUploadFileInput): HttpRequest {
  return {
    method: "POST",
    path: "/v1/buildUploadFiles",
    body: {
      data: {
        type: "buildUploadFiles",
        attributes: {
          assetType: input.assetType,
          fileName: input.fileName,
          fileSize: input.fileSize,
          uti: input.uti
        },
        relationships: {
          buildUpload: {
            data: {
              type: "buildUploads",
              id: input.buildUploadId
            }
          }
        }
      }
    }
  };
}

export function createMarkBuildUploadFileUploadedRequest(
  input: MarkBuildUploadFileUploadedInput
): HttpRequest {
  return {
    method: "PATCH",
    path: `/v1/buildUploadFiles/${input.buildUploadFileId}`,
    body: {
      data: {
        type: "buildUploadFiles",
        id: input.buildUploadFileId,
        attributes: {
          sourceFileChecksums: {
            file: {
              hash: input.sha256,
              algorithm: "SHA_256"
            },
            composite: {
              hash: input.md5,
              algorithm: "MD5"
            }
          },
          uploaded: true
        }
      }
    }
  };
}

export function createGetBuildUploadRequest(buildUploadId: string): HttpRequest {
  return {
    method: "GET",
    path: `/v1/buildUploads/${buildUploadId}`,
    query: {
      "fields[buildUploads]": "state"
    }
  };
}
