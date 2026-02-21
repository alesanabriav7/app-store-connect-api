import { describe, expect, it } from "vitest";

import { AppsApiRepository } from "../../src/data/apps/apps-api-repository.js";
import type { HttpClient, HttpResponse } from "../../src/data/http/http-client.js";

describe("AppsApiRepository", () => {
  it("maps API payload into app summaries", async () => {
    const httpClient: HttpClient = {
      request: async <T>() =>
        ({
          status: 200,
          headers: new Headers(),
          data: {
            data: [
              {
                id: "123",
                attributes: {
                  name: "Finance Tracker",
                  bundleId: "com.example.finance",
                  sku: "FIN-01"
                }
              }
            ]
          }
        }) as HttpResponse<T>
    };

    const repository = new AppsApiRepository(httpClient);

    const apps = await repository.listApps();

    expect(apps).toEqual([
      {
        id: "123",
        name: "Finance Tracker",
        bundleId: "com.example.finance",
        sku: "FIN-01"
      }
    ]);
  });
});
