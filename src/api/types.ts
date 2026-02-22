import { open } from "node:fs/promises";

import { InfrastructureError, safeReadText } from "./client.js";

// ---------------------------------------------------------------------------
// Upload operation types (shared by builds-upload and screenshots commands)
// ---------------------------------------------------------------------------

export interface UploadHttpHeader {
  readonly name: string;
  readonly value: string;
}

export interface UploadOperation {
  readonly method: string;
  readonly url: string;
  readonly length: number;
  readonly offset: number;
  readonly requestHeaders: readonly UploadHttpHeader[];
}

export function parseUploadOperations(
  operationsPayload: readonly {
    readonly method?: string;
    readonly url?: string;
    readonly offset?: number;
    readonly length?: number;
    readonly requestHeaders?: readonly {
      readonly name?: string;
      readonly value?: string;
    }[];
  }[],
  context: string
): UploadOperation[] {
  return operationsPayload.map((item) => {
    const method = item.method;
    const url = item.url;
    const length = item.length;
    const offset = item.offset;

    if (!method || !url || length === undefined || offset === undefined) {
      throw new InfrastructureError(
        `Malformed ${context} payload: invalid upload operation.`
      );
    }

    const requestHeaders = (item.requestHeaders ?? []).map((header) => {
      if (!header.name || header.value === undefined) {
        throw new InfrastructureError(
          `Malformed ${context} payload: invalid upload operation header.`
        );
      }

      return {
        name: header.name,
        value: header.value
      };
    });

    return {
      method,
      url,
      length,
      offset,
      requestHeaders
    };
  });
}

// ---------------------------------------------------------------------------
// Upload operations executor
// ---------------------------------------------------------------------------

export type UploadFetchLike = (
  input: URL | string,
  init?: RequestInit
) => Promise<Response>;

export async function executeUploadOperations(
  filePath: string,
  operations: readonly UploadOperation[],
  fetchLike: UploadFetchLike = fetch
): Promise<void> {
  const fileHandle = await open(filePath, "r");

  try {
    for (const operation of operations) {
      await executeOperation(fileHandle, operation, fetchLike);
    }
  } finally {
    await fileHandle.close();
  }
}

async function executeOperation(
  fileHandle: Awaited<ReturnType<typeof open>>,
  operation: UploadOperation,
  fetchLike: UploadFetchLike
): Promise<void> {
  if (operation.length < 0 || operation.offset < 0) {
    throw new InfrastructureError("Upload operation has invalid offset/length.");
  }

  const headers = new Headers();
  for (const header of operation.requestHeaders) {
    headers.set(header.name, header.value);
  }

  const body =
    operation.length === 0
      ? undefined
      : await readFileChunk(fileHandle, operation.offset, operation.length);

  const requestInit: RequestInit = {
    method: operation.method,
    headers
  };

  if (body !== undefined) {
    requestInit.body = body;
  }

  const response = await fetchLike(operation.url, requestInit);

  if (!response.ok) {
    const errorBody = await safeReadText(response);
    throw new InfrastructureError(
      `Upload operation failed (${response.status}): ${errorBody || response.statusText}`
    );
  }
}

async function readFileChunk(
  fileHandle: Awaited<ReturnType<typeof open>>,
  offset: number,
  length: number
): Promise<Buffer> {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await fileHandle.read({
    buffer,
    offset: 0,
    length,
    position: offset
  });

  if (bytesRead !== length) {
    throw new InfrastructureError(
      `Upload operation expected ${length} bytes but read ${bytesRead} bytes.`
    );
  }

  return buffer;
}
