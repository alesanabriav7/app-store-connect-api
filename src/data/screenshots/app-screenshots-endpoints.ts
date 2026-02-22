import type {
  CreateAppScreenshotInput,
  CreateAppScreenshotSetInput
} from "../../domain/repositories/app-screenshots-repository.js";
import type { HttpRequest } from "../http/http-client.js";

export function createListScreenshotSetsRequest(
  appStoreVersionLocalizationId: string
): HttpRequest {
  return {
    method: "GET",
    path: `/v1/appStoreVersionLocalizations/${appStoreVersionLocalizationId}/appScreenshotSets`,
    query: {
      include: "appScreenshots"
    }
  };
}

export function createScreenshotSetRequest(
  input: CreateAppScreenshotSetInput
): HttpRequest {
  return {
    method: "POST",
    path: "/v1/appScreenshotSets",
    body: {
      data: {
        type: "appScreenshotSets",
        attributes: {
          screenshotDisplayType: input.screenshotDisplayType
        },
        relationships: {
          appStoreVersionLocalization: {
            data: {
              type: "appStoreVersionLocalizations",
              id: input.appStoreVersionLocalizationId
            }
          }
        }
      }
    }
  };
}

export function createScreenshotRequest(input: CreateAppScreenshotInput): HttpRequest {
  return {
    method: "POST",
    path: "/v1/appScreenshots",
    body: {
      data: {
        type: "appScreenshots",
        attributes: {
          fileName: input.fileName,
          fileSize: input.fileSize
        },
        relationships: {
          appScreenshotSet: {
            data: {
              type: "appScreenshotSets",
              id: input.appScreenshotSetId
            }
          }
        }
      }
    }
  };
}

export function createMarkScreenshotUploadedRequest(appScreenshotId: string): HttpRequest {
  return {
    method: "PATCH",
    path: `/v1/appScreenshots/${appScreenshotId}`,
    body: {
      data: {
        type: "appScreenshots",
        id: appScreenshotId,
        attributes: {
          uploaded: true
        }
      }
    }
  };
}

export function createDeleteScreenshotRequest(appScreenshotId: string): HttpRequest {
  return {
    method: "DELETE",
    path: `/v1/appScreenshots/${appScreenshotId}`
  };
}
