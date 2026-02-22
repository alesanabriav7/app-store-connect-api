import { InfrastructureError } from "../../core/errors.js";
import type {
  CreateAppStoreVersionInput,
  CreateAppStoreVersionPhasedReleaseInput,
  UpdateAppStoreVersionInput,
  UpdateAppStoreVersionPhasedReleaseInput
} from "../../domain/repositories/app-releases-repository.js";
import type { HttpRequest } from "../http/http-client.js";

export function createListAppStoreVersionsRequest(appId: string): HttpRequest {
  return {
    method: "GET",
    path: `/v1/apps/${appId}/appStoreVersions`,
    query: {
      "fields[appStoreVersions]":
        "versionString,platform,appStoreState,releaseType,earliestReleaseDate"
    }
  };
}

export function createAppStoreVersionRequest(
  input: CreateAppStoreVersionInput
): HttpRequest {
  return {
    method: "POST",
    path: "/v1/appStoreVersions",
    body: {
      data: {
        type: "appStoreVersions",
        attributes: {
          versionString: input.versionString,
          platform: input.platform,
          ...(input.releaseType !== undefined
            ? {
                releaseType: input.releaseType
              }
            : {})
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

export function createUpdateAppStoreVersionRequest(
  input: UpdateAppStoreVersionInput
): HttpRequest {
  const attributes = {
    ...(input.releaseType !== undefined ? { releaseType: input.releaseType } : {}),
    ...(input.earliestReleaseDate !== undefined
      ? { earliestReleaseDate: input.earliestReleaseDate }
      : {})
  };

  if (Object.keys(attributes).length === 0) {
    throw new InfrastructureError(
      "At least one app store version field is required for update."
    );
  }

  return {
    method: "PATCH",
    path: `/v1/appStoreVersions/${input.appStoreVersionId}`,
    body: {
      data: {
        type: "appStoreVersions",
        id: input.appStoreVersionId,
        attributes
      }
    }
  };
}

export function createAppStoreVersionSubmissionRequest(
  appStoreVersionId: string
): HttpRequest {
  return {
    method: "POST",
    path: "/v1/appStoreVersionSubmissions",
    body: {
      data: {
        type: "appStoreVersionSubmissions",
        relationships: {
          appStoreVersion: {
            data: {
              type: "appStoreVersions",
              id: appStoreVersionId
            }
          }
        }
      }
    }
  };
}

export function createAppStoreVersionPhasedReleaseRequest(
  input: CreateAppStoreVersionPhasedReleaseInput
): HttpRequest {
  return {
    method: "POST",
    path: "/v1/appStoreVersionPhasedReleases",
    body: {
      data: {
        type: "appStoreVersionPhasedReleases",
        attributes: {
          phasedReleaseState: input.phasedReleaseState
        },
        relationships: {
          appStoreVersion: {
            data: {
              type: "appStoreVersions",
              id: input.appStoreVersionId
            }
          }
        }
      }
    }
  };
}

export function createUpdateAppStoreVersionPhasedReleaseRequest(
  input: UpdateAppStoreVersionPhasedReleaseInput
): HttpRequest {
  return {
    method: "PATCH",
    path: `/v1/appStoreVersionPhasedReleases/${input.appStoreVersionPhasedReleaseId}`,
    body: {
      data: {
        type: "appStoreVersionPhasedReleases",
        id: input.appStoreVersionPhasedReleaseId,
        attributes: {
          phasedReleaseState: input.phasedReleaseState
        }
      }
    }
  };
}
