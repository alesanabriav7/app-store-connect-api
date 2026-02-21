import { open } from "node:fs/promises";

import { InfrastructureError } from "../../core/errors.js";
import type {
  ExecuteUploadOperationsInput,
  UploadOperation,
  UploadOperationsExecutor
} from "../../domain/services/upload-operations-executor.js";

export type UploadFetchLike = (
  input: URL | string,
  init?: RequestInit
) => Promise<Response>;

export class HttpUploadOperationsExecutor implements UploadOperationsExecutor {
  public constructor(private readonly fetchLike: UploadFetchLike = fetch) {}

  public async execute(input: ExecuteUploadOperationsInput): Promise<void> {
    const fileHandle = await open(input.filePath, "r");

    try {
      for (const operation of input.operations) {
        await this.executeOperation(fileHandle, operation);
      }
    } finally {
      await fileHandle.close();
    }
  }

  private async executeOperation(
    fileHandle: Awaited<ReturnType<typeof open>>,
    operation: UploadOperation
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
        : await this.readFileChunk(fileHandle, operation.offset, operation.length);

    const requestInit: RequestInit = {
      method: operation.method,
      headers
    };

    if (body !== undefined) {
      requestInit.body = body;
    }

    const response = await this.fetchLike(operation.url, requestInit);

    if (!response.ok) {
      const errorBody = await this.safeReadText(response);
      throw new InfrastructureError(
        `Upload operation failed (${response.status}): ${errorBody || response.statusText}`
      );
    }
  }

  private async readFileChunk(
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

  private async safeReadText(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return "";
    }
  }
}
