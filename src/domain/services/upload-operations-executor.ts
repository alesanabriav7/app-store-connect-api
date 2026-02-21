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

export interface ExecuteUploadOperationsInput {
  readonly filePath: string;
  readonly operations: readonly UploadOperation[];
}

export interface UploadOperationsExecutor {
  execute(input: ExecuteUploadOperationsInput): Promise<void>;
}
