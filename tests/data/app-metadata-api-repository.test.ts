import { describe, expect, it } from "vitest";

import { AppMetadataApiRepository } from "../../src/data/metadata/app-metadata-api-repository.js";
import type { HttpClient, HttpRequest, HttpResponse } from "../../src/data/http/http-client.js";

describe("AppMetadataApiRepository", () => {
  it("lists app info localizations and updates metadata fields", async () => {
    const requests: HttpRequest[] = [];

    const httpClient: HttpClient = {
      request: async <T>(request: HttpRequest) => {
        requests.push(request);

        if (request.method === "GET") {
          return {
            status: 200,
            headers: new Headers(),
            data: {
              data: [
                {
                  id: "info-loc-1",
                  attributes: {
                    locale: "en-US",
                    name: "Finance Tracker",
                    subtitle: "Budget smarter"
                  }
                }
              ]
            }
          } as HttpResponse<T>;
        }

        return {
          status: 200,
          headers: new Headers(),
          data: {
            data: {
              id: "info-loc-1",
              attributes: {
                locale: "en-US",
                name: "Finance Tracker Plus",
                subtitle: "Plan and save"
              }
            }
          }
        } as HttpResponse<T>;
      }
    };

    const repository = new AppMetadataApiRepository(httpClient);

    const localizations = await repository.listAppInfoLocalizations("app-info-1");
    const updated = await repository.updateAppInfoLocalization({
      appInfoLocalizationId: "info-loc-1",
      name: "Finance Tracker Plus",
      subtitle: "Plan and save"
    });

    expect(localizations).toEqual([
      {
        id: "info-loc-1",
        locale: "en-US",
        name: "Finance Tracker",
        subtitle: "Budget smarter"
      }
    ]);
    expect(updated).toEqual({
      id: "info-loc-1",
      locale: "en-US",
      name: "Finance Tracker Plus",
      subtitle: "Plan and save"
    });
    expect(requests[0]).toEqual({
      method: "GET",
      path: "/v1/appInfos/app-info-1/appInfoLocalizations"
    });
    expect(requests[1]?.path).toBe("/v1/appInfoLocalizations/info-loc-1");
    expect(requests[1]?.method).toBe("PATCH");
    expect(requests[1]?.body).toEqual({
      data: {
        type: "appInfoLocalizations",
        id: "info-loc-1",
        attributes: {
          name: "Finance Tracker Plus",
          subtitle: "Plan and save"
        }
      }
    });
  });

  it("lists app store version localizations and updates description/keywords", async () => {
    const requests: HttpRequest[] = [];

    const httpClient: HttpClient = {
      request: async <T>(request: HttpRequest) => {
        requests.push(request);

        if (request.method === "GET") {
          return {
            status: 200,
            headers: new Headers(),
            data: {
              data: [
                {
                  id: "version-loc-1",
                  attributes: {
                    locale: "en-US",
                    description: "Track daily expenses.",
                    keywords: "budget,finance,tracker"
                  }
                }
              ]
            }
          } as HttpResponse<T>;
        }

        return {
          status: 200,
          headers: new Headers(),
          data: {
            data: {
              id: "version-loc-1",
              attributes: {
                locale: "en-US",
                description: "Track daily expenses and goals.",
                keywords: "budget,finance,tracker,savings"
              }
            }
          }
        } as HttpResponse<T>;
      }
    };

    const repository = new AppMetadataApiRepository(httpClient);

    const localizations = await repository.listAppStoreVersionLocalizations("version-1");
    const updated = await repository.updateAppStoreVersionLocalization({
      appStoreVersionLocalizationId: "version-loc-1",
      description: "Track daily expenses and goals.",
      keywords: "budget,finance,tracker,savings"
    });

    expect(localizations).toEqual([
      {
        id: "version-loc-1",
        locale: "en-US",
        description: "Track daily expenses.",
        keywords: "budget,finance,tracker"
      }
    ]);
    expect(updated).toEqual({
      id: "version-loc-1",
      locale: "en-US",
      description: "Track daily expenses and goals.",
      keywords: "budget,finance,tracker,savings"
    });
    expect(requests[0]).toEqual({
      method: "GET",
      path: "/v1/appStoreVersions/version-1/appStoreVersionLocalizations"
    });
    expect(requests[1]?.path).toBe("/v1/appStoreVersionLocalizations/version-loc-1");
    expect(requests[1]?.method).toBe("PATCH");
    expect(requests[1]?.body).toEqual({
      data: {
        type: "appStoreVersionLocalizations",
        id: "version-loc-1",
        attributes: {
          description: "Track daily expenses and goals.",
          keywords: "budget,finance,tracker,savings"
        }
      }
    });
  });
});
