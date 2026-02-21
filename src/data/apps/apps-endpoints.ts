import type { HttpRequest } from "../http/http-client.js";

export interface ListAppsOptions {
  readonly limit?: number;
}

const DEFAULT_LIST_LIMIT = 50;

export function createListAppsRequest(options: ListAppsOptions = {}): HttpRequest {
  return {
    method: "GET",
    path: "/v1/apps",
    query: {
      limit: options.limit ?? DEFAULT_LIST_LIMIT
    }
  };
}
