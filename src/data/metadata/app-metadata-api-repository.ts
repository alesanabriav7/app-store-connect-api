import { InfrastructureError } from "../../core/errors.js";
import type {
  AppInfoLocalizationSummary,
  AppMetadataRepository,
  AppStoreVersionLocalizationSummary,
  UpdateAppInfoLocalizationInput,
  UpdateAppStoreVersionLocalizationInput
} from "../../domain/repositories/app-metadata-repository.js";
import type { HttpClient } from "../http/http-client.js";
import type {
  AppStoreConnectAppInfoLocalizationResource,
  AppStoreConnectAppInfoLocalizationResponse,
  AppStoreConnectAppStoreVersionLocalizationResource,
  AppStoreConnectAppStoreVersionLocalizationResponse,
  AppStoreConnectListAppInfoLocalizationsResponse,
  AppStoreConnectListAppStoreVersionLocalizationsResponse
} from "./app-metadata-api-contract.js";
import {
  createListAppInfoLocalizationsRequest,
  createListAppStoreVersionLocalizationsRequest,
  createUpdateAppInfoLocalizationRequest,
  createUpdateAppStoreVersionLocalizationRequest
} from "./app-metadata-endpoints.js";

export class AppMetadataApiRepository implements AppMetadataRepository {
  public constructor(private readonly httpClient: HttpClient) {}

  public async listAppInfoLocalizations(
    appInfoId: string
  ): Promise<readonly AppInfoLocalizationSummary[]> {
    const response = await this.httpClient.request<AppStoreConnectListAppInfoLocalizationsResponse>(
      createListAppInfoLocalizationsRequest(appInfoId)
    );

    return response.data.data.map((item) => this.mapAppInfoLocalization(item));
  }

  public async updateAppInfoLocalization(
    input: UpdateAppInfoLocalizationInput
  ): Promise<AppInfoLocalizationSummary> {
    const response = await this.httpClient.request<AppStoreConnectAppInfoLocalizationResponse>(
      createUpdateAppInfoLocalizationRequest(input)
    );

    return this.mapAppInfoLocalization(response.data.data);
  }

  public async listAppStoreVersionLocalizations(
    appStoreVersionId: string
  ): Promise<readonly AppStoreVersionLocalizationSummary[]> {
    const response =
      await this.httpClient.request<AppStoreConnectListAppStoreVersionLocalizationsResponse>(
        createListAppStoreVersionLocalizationsRequest(appStoreVersionId)
      );

    return response.data.data.map((item) => this.mapAppStoreVersionLocalization(item));
  }

  public async updateAppStoreVersionLocalization(
    input: UpdateAppStoreVersionLocalizationInput
  ): Promise<AppStoreVersionLocalizationSummary> {
    const response =
      await this.httpClient.request<AppStoreConnectAppStoreVersionLocalizationResponse>(
        createUpdateAppStoreVersionLocalizationRequest(input)
      );

    return this.mapAppStoreVersionLocalization(response.data.data);
  }

  private mapAppInfoLocalization(
    item: AppStoreConnectAppInfoLocalizationResource
  ): AppInfoLocalizationSummary {
    const id = item.id;
    const locale = item.attributes?.locale;

    if (!id || !locale) {
      throw new InfrastructureError(
        "Malformed app info localization payload: missing id or locale."
      );
    }

    return {
      id,
      locale,
      name: item.attributes?.name ?? null,
      subtitle: item.attributes?.subtitle ?? null
    };
  }

  private mapAppStoreVersionLocalization(
    item: AppStoreConnectAppStoreVersionLocalizationResource
  ): AppStoreVersionLocalizationSummary {
    const id = item.id;
    const locale = item.attributes?.locale;

    if (!id || !locale) {
      throw new InfrastructureError(
        "Malformed app store version localization payload: missing id or locale."
      );
    }

    return {
      id,
      locale,
      description: item.attributes?.description ?? null,
      keywords: item.attributes?.keywords ?? null
    };
  }
}
