import { describe, expect, it } from "vitest";

import { AppScreenshotsApiRepository } from "../../src/data/screenshots/app-screenshots-api-repository.js";
import type { HttpClient, HttpRequest, HttpResponse } from "../../src/data/http/http-client.js";

describe("AppScreenshotsApiRepository", () => {
  it("lists screenshot sets and maps related screenshots", async () => {
    const requests: HttpRequest[] = [];

    const httpClient: HttpClient = {
      request: async <T>(request: HttpRequest) => {
        requests.push(request);

        return {
          status: 200,
          headers: new Headers(),
          data: {
            data: [
              {
                id: "set-1",
                attributes: {
                  screenshotDisplayType: "APP_IPHONE_67"
                },
                relationships: {
                  appScreenshots: {
                    data: [{ id: "shot-1" }]
                  }
                }
              }
            ],
            included: [
              {
                id: "shot-1",
                attributes: {
                  fileName: "home.png",
                  assetDeliveryState: {
                    state: "COMPLETE"
                  }
                }
              }
            ]
          }
        } as HttpResponse<T>;
      }
    };

    const repository = new AppScreenshotsApiRepository(httpClient);

    const sets = await repository.listScreenshotSets("loc-1");

    expect(requests).toHaveLength(1);
    expect(requests[0]?.path).toBe("/v1/appStoreVersionLocalizations/loc-1/appScreenshotSets");
    expect(requests[0]?.method).toBe("GET");
    expect(requests[0]?.query).toEqual({
      include: "appScreenshots"
    });
    expect(sets).toEqual([
      {
        id: "set-1",
        screenshotDisplayType: "APP_IPHONE_67",
        screenshots: [
          {
            id: "shot-1",
            fileName: "home.png",
            assetDeliveryState: "COMPLETE"
          }
        ]
      }
    ]);
  });

  it("creates screenshot upload and maps upload operations", async () => {
    const requests: HttpRequest[] = [];

    const httpClient: HttpClient = {
      request: async <T>(request: HttpRequest) => {
        requests.push(request);

        return {
          status: 201,
          headers: new Headers(),
          data: {
            data: {
              id: "shot-1",
              attributes: {
                fileName: "home.png",
                assetDeliveryState: {
                  state: "AWAITING_UPLOAD"
                },
                uploadOperations: [
                  {
                    method: "PUT",
                    url: "https://upload.example.test/shot-1",
                    offset: 0,
                    length: 12,
                    requestHeaders: [
                      {
                        name: "Content-Type",
                        value: "image/png"
                      }
                    ]
                  }
                ]
              }
            }
          }
        } as HttpResponse<T>;
      }
    };

    const repository = new AppScreenshotsApiRepository(httpClient);

    const screenshot = await repository.createScreenshot({
      appScreenshotSetId: "set-1",
      fileName: "home.png",
      fileSize: 12
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]?.path).toBe("/v1/appScreenshots");
    expect(requests[0]?.method).toBe("POST");
    expect(requests[0]?.body).toEqual({
      data: {
        type: "appScreenshots",
        attributes: {
          fileName: "home.png",
          fileSize: 12
        },
        relationships: {
          appScreenshotSet: {
            data: {
              type: "appScreenshotSets",
              id: "set-1"
            }
          }
        }
      }
    });
    expect(screenshot).toEqual({
      id: "shot-1",
      fileName: "home.png",
      assetDeliveryState: "AWAITING_UPLOAD",
      uploadOperations: [
        {
          method: "PUT",
          url: "https://upload.example.test/shot-1",
          offset: 0,
          length: 12,
          requestHeaders: [
            {
              name: "Content-Type",
              value: "image/png"
            }
          ]
        }
      ]
    });
  });

  it("marks screenshot uploaded and deletes it", async () => {
    const requests: HttpRequest[] = [];

    const httpClient: HttpClient = {
      request: async <T>(request: HttpRequest) => {
        requests.push(request);

        return {
          status: 204,
          headers: new Headers(),
          data: undefined as T
        };
      }
    };

    const repository = new AppScreenshotsApiRepository(httpClient);

    await repository.markScreenshotUploaded("shot-1");
    await repository.deleteScreenshot("shot-1");

    expect(requests).toHaveLength(2);
    expect(requests[0]?.path).toBe("/v1/appScreenshots/shot-1");
    expect(requests[0]?.method).toBe("PATCH");
    expect(requests[0]?.body).toEqual({
      data: {
        type: "appScreenshots",
        id: "shot-1",
        attributes: {
          uploaded: true
        }
      }
    });
    expect(requests[1]).toEqual({
      method: "DELETE",
      path: "/v1/appScreenshots/shot-1"
    });
  });
});
