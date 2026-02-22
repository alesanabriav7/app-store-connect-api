import { describe, expect, it } from "vitest";

import { AppReleasesApiRepository } from "../../src/data/releases/app-releases-api-repository.js";
import type { HttpClient, HttpRequest, HttpResponse } from "../../src/data/http/http-client.js";

describe("AppReleasesApiRepository", () => {
  it("lists and creates app store versions", async () => {
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
                  id: "version-1",
                  attributes: {
                    versionString: "1.2.3",
                    platform: "IOS",
                    appStoreState: "PREPARE_FOR_SUBMISSION",
                    releaseType: "MANUAL",
                    earliestReleaseDate: "2026-02-20"
                  }
                }
              ]
            }
          } as HttpResponse<T>;
        }

        return {
          status: 201,
          headers: new Headers(),
          data: {
            data: {
              id: "version-2",
              attributes: {
                versionString: "1.2.4",
                platform: "IOS",
                appStoreState: "PREPARE_FOR_SUBMISSION",
                releaseType: "AFTER_APPROVAL"
              }
            }
          }
        } as HttpResponse<T>;
      }
    };

    const repository = new AppReleasesApiRepository(httpClient);

    const versions = await repository.listAppStoreVersions("app-1");
    const created = await repository.createAppStoreVersion({
      appId: "app-1",
      versionString: "1.2.4",
      platform: "IOS",
      releaseType: "AFTER_APPROVAL"
    });

    expect(versions).toEqual([
      {
        id: "version-1",
        versionString: "1.2.3",
        platform: "IOS",
        appStoreState: "PREPARE_FOR_SUBMISSION",
        releaseType: "MANUAL",
        earliestReleaseDate: "2026-02-20"
      }
    ]);
    expect(created).toEqual({
      id: "version-2",
      versionString: "1.2.4",
      platform: "IOS",
      appStoreState: "PREPARE_FOR_SUBMISSION",
      releaseType: "AFTER_APPROVAL",
      earliestReleaseDate: null
    });

    expect(requests[0]?.path).toBe("/v1/apps/app-1/appStoreVersions");
    expect(requests[0]?.method).toBe("GET");
    expect(requests[1]?.path).toBe("/v1/appStoreVersions");
    expect(requests[1]?.method).toBe("POST");
    expect(requests[1]?.body).toEqual({
      data: {
        type: "appStoreVersions",
        attributes: {
          versionString: "1.2.4",
          platform: "IOS",
          releaseType: "AFTER_APPROVAL"
        },
        relationships: {
          app: {
            data: {
              type: "apps",
              id: "app-1"
            }
          }
        }
      }
    });
  });

  it("updates release state, submits for review, and manages phased release", async () => {
    const requests: HttpRequest[] = [];

    const httpClient: HttpClient = {
      request: async <T>(request: HttpRequest) => {
        requests.push(request);

        if (
          request.method === "PATCH" &&
          request.path === "/v1/appStoreVersions/version-1"
        ) {
          return {
            status: 200,
            headers: new Headers(),
            data: {
              data: {
                id: "version-1",
                attributes: {
                  versionString: "1.2.3",
                  platform: "IOS",
                  appStoreState: "WAITING_FOR_REVIEW",
                  releaseType: "SCHEDULED",
                  earliestReleaseDate: "2026-03-01"
                }
              }
            }
          } as HttpResponse<T>;
        }

        if (
          request.method === "POST" &&
          request.path === "/v1/appStoreVersionSubmissions"
        ) {
          return {
            status: 201,
            headers: new Headers(),
            data: {
              data: {
                id: "submission-1"
              }
            }
          } as HttpResponse<T>;
        }

        if (
          request.method === "POST" &&
          request.path === "/v1/appStoreVersionPhasedReleases"
        ) {
          return {
            status: 201,
            headers: new Headers(),
            data: {
              data: {
                id: "phased-1",
                attributes: {
                  phasedReleaseState: "ACTIVE",
                  currentDayNumber: 1,
                  startDate: "2026-03-02"
                }
              }
            }
          } as HttpResponse<T>;
        }

        if (
          request.method === "PATCH" &&
          request.path === "/v1/appStoreVersionPhasedReleases/phased-1"
        ) {
          return {
            status: 200,
            headers: new Headers(),
            data: {
              data: {
                id: "phased-1",
                attributes: {
                  phasedReleaseState: "PAUSED",
                  currentDayNumber: 3,
                  startDate: "2026-03-02"
                }
              }
            }
          } as HttpResponse<T>;
        }

        throw new Error(
          `Unexpected request in test: ${request.method} ${request.path}`
        );
      }
    };

    const repository = new AppReleasesApiRepository(httpClient);

    const updatedVersion = await repository.updateAppStoreVersion({
      appStoreVersionId: "version-1",
      releaseType: "SCHEDULED",
      earliestReleaseDate: "2026-03-01"
    });
    const submission = await repository.submitAppStoreVersionForReview("version-1");
    const createdPhasedRelease = await repository.createPhasedRelease({
      appStoreVersionId: "version-1",
      phasedReleaseState: "ACTIVE"
    });
    const updatedPhasedRelease = await repository.updatePhasedRelease({
      appStoreVersionPhasedReleaseId: "phased-1",
      phasedReleaseState: "PAUSED"
    });

    expect(updatedVersion).toEqual({
      id: "version-1",
      versionString: "1.2.3",
      platform: "IOS",
      appStoreState: "WAITING_FOR_REVIEW",
      releaseType: "SCHEDULED",
      earliestReleaseDate: "2026-03-01"
    });
    expect(submission).toEqual({
      id: "submission-1"
    });
    expect(createdPhasedRelease).toEqual({
      id: "phased-1",
      phasedReleaseState: "ACTIVE",
      currentDayNumber: 1,
      startDate: "2026-03-02"
    });
    expect(updatedPhasedRelease).toEqual({
      id: "phased-1",
      phasedReleaseState: "PAUSED",
      currentDayNumber: 3,
      startDate: "2026-03-02"
    });

    expect(requests).toHaveLength(4);

    const updateVersionRequest = requests.find(
      (request) =>
        request.method === "PATCH" &&
        request.path === "/v1/appStoreVersions/version-1"
    );
    expect(updateVersionRequest?.body).toEqual({
      data: {
        type: "appStoreVersions",
        id: "version-1",
        attributes: {
          releaseType: "SCHEDULED",
          earliestReleaseDate: "2026-03-01"
        }
      }
    });

    const submissionRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.path === "/v1/appStoreVersionSubmissions"
    );
    expect(submissionRequest?.body).toEqual({
      data: {
        type: "appStoreVersionSubmissions",
        relationships: {
          appStoreVersion: {
            data: {
              type: "appStoreVersions",
              id: "version-1"
            }
          }
        }
      }
    });

    const createPhasedReleaseRequest = requests.find(
      (request) =>
        request.method === "POST" &&
        request.path === "/v1/appStoreVersionPhasedReleases"
    );
    expect(createPhasedReleaseRequest?.body).toEqual({
      data: {
        type: "appStoreVersionPhasedReleases",
        attributes: {
          phasedReleaseState: "ACTIVE"
        },
        relationships: {
          appStoreVersion: {
            data: {
              type: "appStoreVersions",
              id: "version-1"
            }
          }
        }
      }
    });

    const updatePhasedReleaseRequest = requests.find(
      (request) =>
        request.method === "PATCH" &&
        request.path === "/v1/appStoreVersionPhasedReleases/phased-1"
    );
    expect(updatePhasedReleaseRequest?.body).toEqual({
      data: {
        type: "appStoreVersionPhasedReleases",
        id: "phased-1",
        attributes: {
          phasedReleaseState: "PAUSED"
        }
      }
    });
  });
});
