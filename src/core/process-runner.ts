export interface ProcessRunOptions {
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
}

export interface ProcessRunResult {
  readonly stdout: string;
  readonly stderr: string;
}

export interface ProcessRunner {
  run(
    command: string,
    args: readonly string[],
    options?: ProcessRunOptions
  ): Promise<ProcessRunResult>;
}
