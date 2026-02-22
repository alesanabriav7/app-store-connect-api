import { InfrastructureError } from "../../core/errors.js";
import type {
  AppReleasesRepository,
  AppStoreVersionPhasedReleaseSummary,
  AppStoreVersionSubmissionSummary,
  AppStoreVersionSummary,
  CreateAppStoreVersionInput,
  CreateAppStoreVersionPhasedReleaseInput,
  UpdateAppStoreVersionInput,
  UpdateAppStoreVersionPhasedReleaseInput
} from "../../domain/repositories/app-releases-repository.js";
import type { HttpClient } from "../http/http-client.js";
import type {
  AppStoreConnectAppStoreVersionPhasedReleaseResource,
  AppStoreConnectAppStoreVersionPhasedReleaseResponse,
  AppStoreConnectAppStoreVersionResource,
  AppStoreConnectAppStoreVersionResponse,
  AppStoreConnectAppStoreVersionSubmissionResource,
  AppStoreConnectAppStoreVersionSubmissionResponse,
  AppStoreConnectListAppStoreVersionsResponse
} from "./app-releases-api-contract.js";
import {
  createAppStoreVersionPhasedReleaseRequest,
  createAppStoreVersionRequest,
  createAppStoreVersionSubmissionRequest,
  createListAppStoreVersionsRequest,
  createUpdateAppStoreVersionPhasedReleaseRequest,
  createUpdateAppStoreVersionRequest
} from "./app-releases-endpoints.js";

export class AppReleasesApiRepository implements AppReleasesRepository {
  public constructor(private readonly httpClient: HttpClient) {}

  public async listAppStoreVersions(appId: string): Promise<readonly AppStoreVersionSummary[]> {
    const response = await this.httpClient.request<AppStoreConnectListAppStoreVersionsResponse>(
      createListAppStoreVersionsRequest(appId)
    );

    return response.data.data.map((item) => this.mapAppStoreVersion(item));
  }

  public async createAppStoreVersion(
    input: CreateAppStoreVersionInput
  ): Promise<AppStoreVersionSummary> {
    const response = await this.httpClient.request<AppStoreConnectAppStoreVersionResponse>(
      createAppStoreVersionRequest(input)
    );

    return this.mapAppStoreVersion(response.data.data);
  }

  public async updateAppStoreVersion(
    input: UpdateAppStoreVersionInput
  ): Promise<AppStoreVersionSummary> {
    const response = await this.httpClient.request<AppStoreConnectAppStoreVersionResponse>(
      createUpdateAppStoreVersionRequest(input)
    );

    return this.mapAppStoreVersion(response.data.data);
  }

  public async submitAppStoreVersionForReview(
    appStoreVersionId: string
  ): Promise<AppStoreVersionSubmissionSummary> {
    const response =
      await this.httpClient.request<AppStoreConnectAppStoreVersionSubmissionResponse>(
        createAppStoreVersionSubmissionRequest(appStoreVersionId)
      );

    return this.mapAppStoreVersionSubmission(response.data.data);
  }

  public async createPhasedRelease(
    input: CreateAppStoreVersionPhasedReleaseInput
  ): Promise<AppStoreVersionPhasedReleaseSummary> {
    const response =
      await this.httpClient.request<AppStoreConnectAppStoreVersionPhasedReleaseResponse>(
        createAppStoreVersionPhasedReleaseRequest(input)
      );

    return this.mapPhasedRelease(response.data.data);
  }

  public async updatePhasedRelease(
    input: UpdateAppStoreVersionPhasedReleaseInput
  ): Promise<AppStoreVersionPhasedReleaseSummary> {
    const response =
      await this.httpClient.request<AppStoreConnectAppStoreVersionPhasedReleaseResponse>(
        createUpdateAppStoreVersionPhasedReleaseRequest(input)
      );

    return this.mapPhasedRelease(response.data.data);
  }

  private mapAppStoreVersion(
    item: AppStoreConnectAppStoreVersionResource
  ): AppStoreVersionSummary {
    const id = item.id;

    if (!id) {
      throw new InfrastructureError("Malformed app store version payload: missing id.");
    }

    return {
      id,
      versionString: item.attributes?.versionString ?? null,
      platform: item.attributes?.platform ?? null,
      appStoreState: item.attributes?.appStoreState ?? null,
      releaseType: item.attributes?.releaseType ?? null,
      earliestReleaseDate: item.attributes?.earliestReleaseDate ?? null
    };
  }

  private mapPhasedRelease(
    item: AppStoreConnectAppStoreVersionPhasedReleaseResource
  ): AppStoreVersionPhasedReleaseSummary {
    const id = item.id;
    const phasedReleaseState = item.attributes?.phasedReleaseState;

    if (!id || !phasedReleaseState) {
      throw new InfrastructureError(
        "Malformed app store version phased release payload: missing id or state."
      );
    }

    return {
      id,
      phasedReleaseState,
      currentDayNumber: item.attributes?.currentDayNumber ?? null,
      startDate: item.attributes?.startDate ?? null
    };
  }

  private mapAppStoreVersionSubmission(
    item: AppStoreConnectAppStoreVersionSubmissionResource
  ): AppStoreVersionSubmissionSummary {
    const id = item.id;

    if (!id) {
      throw new InfrastructureError(
        "Malformed app store version submission payload: missing id."
      );
    }

    return {
      id
    };
  }
}
