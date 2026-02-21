import { InfrastructureError } from "../../core/errors.js";
import type {
  BuildUploadFileSummary,
  BuildUploadsRepository,
  BuildUploadSummary,
  CreateBuildUploadFileInput,
  CreateBuildUploadInput,
  MarkBuildUploadFileUploadedInput
} from "../../domain/repositories/build-uploads-repository.js";
import type { UploadOperation } from "../../domain/services/upload-operations-executor.js";
import type { HttpClient } from "../http/http-client.js";
import type {
  AppStoreConnectBuildUploadFileResponse,
  AppStoreConnectBuildUploadResponse,
  AppStoreConnectBuildUploadState
} from "./build-uploads-api-contract.js";
import {
  createBuildUploadFileRequest,
  createBuildUploadRequest,
  createGetBuildUploadRequest,
  createMarkBuildUploadFileUploadedRequest
} from "./build-uploads-endpoints.js";

export class BuildUploadsApiRepository implements BuildUploadsRepository {
  public constructor(private readonly httpClient: HttpClient) {}

  public async createBuildUpload(input: CreateBuildUploadInput): Promise<BuildUploadSummary> {
    const response = await this.httpClient.request<AppStoreConnectBuildUploadResponse>(
      createBuildUploadRequest(input)
    );

    return this.mapBuildUpload(response.data);
  }

  public async createBuildUploadFile(
    input: CreateBuildUploadFileInput
  ): Promise<BuildUploadFileSummary> {
    const response = await this.httpClient.request<AppStoreConnectBuildUploadFileResponse>(
      createBuildUploadFileRequest(input)
    );

    const id = response.data.data.id;
    const operationsPayload = response.data.data.attributes?.uploadOperations ?? [];

    if (!id) {
      throw new InfrastructureError("Malformed build upload file payload: missing id.");
    }

    const uploadOperations = operationsPayload.map<UploadOperation>((item) => {
      const method = item.method;
      const url = item.url;
      const length = item.length;
      const offset = item.offset;

      if (!method || !url || length === undefined || offset === undefined) {
        throw new InfrastructureError(
          "Malformed build upload file payload: invalid upload operation."
        );
      }

      const requestHeaders = (item.requestHeaders ?? []).map((header) => {
        if (!header.name || header.value === undefined) {
          throw new InfrastructureError(
            "Malformed build upload file payload: invalid upload operation header."
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
        length,
        offset,
        requestHeaders
      };
    });

    return {
      id,
      uploadOperations
    };
  }

  public async markBuildUploadFileUploaded(
    input: MarkBuildUploadFileUploadedInput
  ): Promise<void> {
    await this.httpClient.request<void>(
      createMarkBuildUploadFileUploadedRequest(input)
    );
  }

  public async getBuildUpload(buildUploadId: string): Promise<BuildUploadSummary> {
    const response = await this.httpClient.request<AppStoreConnectBuildUploadResponse>(
      createGetBuildUploadRequest(buildUploadId)
    );

    return this.mapBuildUpload(response.data);
  }

  private mapBuildUpload(response: AppStoreConnectBuildUploadResponse): BuildUploadSummary {
    const data = response.data;
    const id = data.id;

    if (!id) {
      throw new InfrastructureError("Malformed build upload payload: missing id.");
    }

    return {
      id,
      state: this.mapState(data.attributes?.state)
    };
  }

  private mapState(state: AppStoreConnectBuildUploadState | undefined): BuildUploadSummary["state"] {
    const stateValue = state?.state;

    if (!stateValue) {
      throw new InfrastructureError("Malformed build upload payload: missing state.");
    }

    return {
      state: stateValue,
      errors: (state?.errors ?? []).map((item) => item.description ?? "Unknown error"),
      warnings: (state?.warnings ?? []).map((item) => item.description ?? "Unknown warning"),
      infos: (state?.infos ?? []).map((item) => item.description ?? "Unknown info")
    };
  }
}
