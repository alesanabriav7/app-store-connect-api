import { InfrastructureError } from "../../core/errors.js";
import type { AppStoreConnectAuthTokenProvider } from "../../domain/services/app-store-connect-token-provider.js";
import type { HttpClient, HttpQueryValue, HttpRequest, HttpResponse } from "./http-client.js";

export type FetchLike = (
  input: URL | string,
  init?: RequestInit
) => Promise<Response>;

export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: URL;

  public constructor(
    baseUrl: string,
    private readonly tokenProvider: AppStoreConnectAuthTokenProvider,
    private readonly fetchLike: FetchLike = fetch
  ) {
    this.baseUrl = new URL(baseUrl);
  }

  public async request<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const token = await this.tokenProvider.getToken();
    const url = this.buildUrl(request.path, request.query);

    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const hasBody = request.body !== undefined;
    if (hasBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const requestInit: RequestInit = {
      method: request.method,
      headers
    };

    if (hasBody) {
      requestInit.body = JSON.stringify(request.body);
    }

    const response = await this.fetchLike(url, requestInit);

    if (!response.ok) {
      const errorBody = await this.safeReadText(response);
      throw new InfrastructureError(
        `App Store Connect request failed (${response.status}): ${errorBody || response.statusText}`
      );
    }

    if (response.status === 204) {
      return {
        status: response.status,
        headers: response.headers,
        data: undefined as T
      };
    }

    const textBody = await response.text();

    if (!textBody) {
      return {
        status: response.status,
        headers: response.headers,
        data: undefined as T
      };
    }

    try {
      return {
        status: response.status,
        headers: response.headers,
        data: JSON.parse(textBody) as T
      };
    } catch (error) {
      throw new InfrastructureError(
        "Received invalid JSON from App Store Connect.",
        error
      );
    }
  }

  private buildUrl(path: string, query?: Readonly<Record<string, HttpQueryValue>>): URL {
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(normalizedPath, this.baseUrl);

    if (!query) {
      return url;
    }

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    return url;
  }

  private async safeReadText(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return "";
    }
  }
}
