import type { HttpMethod } from "../../core/http-method.js";

export type HttpQueryValue = string | number | boolean | undefined;

export interface HttpRequest {
  readonly method: HttpMethod;
  readonly path: string;
  readonly query?: Readonly<Record<string, HttpQueryValue>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

export interface HttpResponse<T> {
  readonly status: number;
  readonly headers: Headers;
  readonly data: T;
}

export interface HttpClient {
  request<T>(request: HttpRequest): Promise<HttpResponse<T>>;
}
