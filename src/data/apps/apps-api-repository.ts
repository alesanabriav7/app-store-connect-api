import { InfrastructureError } from "../../core/errors.js";
import type { AppSummary } from "../../domain/entities/app.js";
import type { AppsRepository } from "../../domain/repositories/apps-repository.js";
import type { HttpClient } from "../http/http-client.js";
import type { AppStoreConnectListAppsResponse } from "./apps-api-contract.js";
import { createListAppsRequest } from "./apps-endpoints.js";

export class AppsApiRepository implements AppsRepository {
  public constructor(private readonly httpClient: HttpClient) {}

  public async listApps(): Promise<readonly AppSummary[]> {
    const response = await this.httpClient.request<AppStoreConnectListAppsResponse>(
      createListAppsRequest()
    );

    return response.data.data.map((item) => {
      const attributes = item.attributes;

      if (!item.id || !attributes?.name || !attributes?.bundleId) {
        throw new InfrastructureError(
          "Malformed app payload received from App Store Connect."
        );
      }

      const summary: AppSummary = {
        id: item.id,
        name: attributes.name,
        bundleId: attributes.bundleId
      };

      if (attributes.sku !== undefined) {
        return {
          ...summary,
          sku: attributes.sku
        } satisfies AppSummary;
      }

      return summary;
    });
  }
}
