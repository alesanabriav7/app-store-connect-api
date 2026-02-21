import { describe, expect, it } from "vitest";

import { InfrastructureError } from "../../src/core/errors.js";
import { FetchHttpClient } from "../../src/data/http/fetch-http-client.js";

describe("FetchHttpClient", () => {
  it("sends bearer token and query params", async () => {
    const calls: { input: URL | string; init: RequestInit | undefined }[] = [];

    const client = new FetchHttpClient(
      "https://api.appstoreconnect.apple.com/",
      {
        getToken: async () => "signed-token"
      },
      async (input, init) => {
        calls.push({ input, init });

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
    );

    const response = await client.request<{ ok: boolean }>({
      method: "GET",
      path: "/v1/apps",
      query: {
        limit: 5
      }
    });

    expect(response.data.ok).toBe(true);
    expect(calls).toHaveLength(1);

    const call = calls[0];
    expect(call?.input instanceof URL).toBe(true);
    expect((call?.input as URL).toString()).toBe(
      "https://api.appstoreconnect.apple.com/v1/apps?limit=5"
    );

    const requestHeaders = new Headers(call?.init?.headers);
    expect(requestHeaders.get("Authorization")).toBe("Bearer signed-token");
  });

  it("throws infrastructure error when response is not ok", async () => {
    const client = new FetchHttpClient(
      "https://api.appstoreconnect.apple.com/",
      {
        getToken: async () => "signed-token"
      },
      async () =>
        new Response(JSON.stringify({ error: "forbidden" }), {
          status: 403,
          statusText: "Forbidden"
        })
    );

    await expect(
      client.request({
        method: "GET",
        path: "/v1/apps"
      })
    ).rejects.toThrowError(InfrastructureError);
  });
});
