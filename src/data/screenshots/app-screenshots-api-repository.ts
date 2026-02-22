import { InfrastructureError } from "../../core/errors.js";
import type {
  AppScreenshotSetSummary,
  AppScreenshotSetWithScreenshots,
  AppScreenshotSummary,
  AppScreenshotUploadSummary,
  AppScreenshotsRepository,
  CreateAppScreenshotInput,
  CreateAppScreenshotSetInput
} from "../../domain/repositories/app-screenshots-repository.js";
import type { UploadOperation } from "../../domain/services/upload-operations-executor.js";
import type { HttpClient } from "../http/http-client.js";
import type {
  AppStoreConnectAppScreenshotResource,
  AppStoreConnectAppScreenshotResponse,
  AppStoreConnectAppScreenshotSetResponse,
  AppStoreConnectAppScreenshotSetResource,
  AppStoreConnectListAppScreenshotSetsResponse
} from "./app-screenshots-api-contract.js";
import {
  createDeleteScreenshotRequest,
  createListScreenshotSetsRequest,
  createMarkScreenshotUploadedRequest,
  createScreenshotRequest,
  createScreenshotSetRequest
} from "./app-screenshots-endpoints.js";

export class AppScreenshotsApiRepository implements AppScreenshotsRepository {
  public constructor(private readonly httpClient: HttpClient) {}

  public async listScreenshotSets(
    appStoreVersionLocalizationId: string
  ): Promise<readonly AppScreenshotSetWithScreenshots[]> {
    const response =
      await this.httpClient.request<AppStoreConnectListAppScreenshotSetsResponse>(
        createListScreenshotSetsRequest(appStoreVersionLocalizationId)
      );

    const includedScreenshots = response.data.included ?? [];
    const screenshotsById = new Map<string, AppScreenshotSummary>();

    for (const item of includedScreenshots) {
      const screenshot = this.mapScreenshotSummary(item);
      screenshotsById.set(screenshot.id, screenshot);
    }

    return response.data.data.map((item) => {
      const set = this.mapScreenshotSet(item);
      const relationships = item.relationships?.appScreenshots?.data ?? [];

      const screenshots = relationships.map((relationship) => {
        const screenshotId = relationship.id;

        if (!screenshotId) {
          throw new InfrastructureError(
            "Malformed screenshot set payload: screenshot relationship id missing."
          );
        }

        return (
          screenshotsById.get(screenshotId) ?? {
            id: screenshotId,
            fileName: null,
            assetDeliveryState: null
          }
        );
      });

      return {
        ...set,
        screenshots
      };
    });
  }

  public async createScreenshotSet(
    input: CreateAppScreenshotSetInput
  ): Promise<AppScreenshotSetSummary> {
    const response = await this.httpClient.request<AppStoreConnectAppScreenshotSetResponse>(
      createScreenshotSetRequest(input)
    );

    return this.mapScreenshotSet(response.data.data);
  }

  public async createScreenshot(
    input: CreateAppScreenshotInput
  ): Promise<AppScreenshotUploadSummary> {
    const response = await this.httpClient.request<AppStoreConnectAppScreenshotResponse>(
      createScreenshotRequest(input)
    );

    const screenshot = this.mapScreenshotSummary(response.data.data);
    const uploadOperationsPayload =
      response.data.data.attributes?.uploadOperations ?? [];

    const uploadOperations = uploadOperationsPayload.map<UploadOperation>((item) => {
      const method = item.method;
      const url = item.url;
      const offset = item.offset;
      const length = item.length;

      if (!method || !url || offset === undefined || length === undefined) {
        throw new InfrastructureError(
          "Malformed screenshot payload: invalid upload operation."
        );
      }

      const requestHeaders = (item.requestHeaders ?? []).map((header) => {
        if (!header.name || header.value === undefined) {
          throw new InfrastructureError(
            "Malformed screenshot payload: invalid upload operation header."
          );
        }

        return {
          name: header.name,
          value: header.value
        };
      });

      return {
        method,
        url,
        offset,
        length,
        requestHeaders
      };
    });

    return {
      ...screenshot,
      uploadOperations
    };
  }

  public async markScreenshotUploaded(appScreenshotId: string): Promise<void> {
    await this.httpClient.request<void>(
      createMarkScreenshotUploadedRequest(appScreenshotId)
    );
  }

  public async deleteScreenshot(appScreenshotId: string): Promise<void> {
    await this.httpClient.request<void>(createDeleteScreenshotRequest(appScreenshotId));
  }

  private mapScreenshotSet(
    item: AppStoreConnectAppScreenshotSetResource
  ): AppScreenshotSetSummary {
    const id = item.id;
    const screenshotDisplayType = item.attributes?.screenshotDisplayType;

    if (!id || !screenshotDisplayType) {
      throw new InfrastructureError(
        "Malformed screenshot set payload: missing id or screenshot display type."
      );
    }

    return {
      id,
      screenshotDisplayType
    };
  }

  private mapScreenshotSummary(
    item: AppStoreConnectAppScreenshotResource
  ): AppScreenshotSummary {
    const id = item.id;

    if (!id) {
      throw new InfrastructureError("Malformed screenshot payload: missing id.");
    }

    return {
      id,
      fileName: item.attributes?.fileName ?? null,
      assetDeliveryState: item.attributes?.assetDeliveryState?.state ?? null
    };
  }
}
