import { describe, expect, it } from "vitest";

import { listApps } from "../../src/commands/apps-list.js";
import type { AppStoreConnectClient, HttpResponse } from "../../src/api/client.js";

describe("listApps", () => {
  it("maps API payload into app summaries", async () => {
    const client = {
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
    } as unknown as AppStoreConnectClient;

    const apps = await listApps(client);

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
