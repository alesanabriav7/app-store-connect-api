import { spawn } from "node:child_process";

import { InfrastructureError } from "../../core/errors.js";
import type {
  ProcessRunOptions,
  ProcessRunResult,
  ProcessRunner
} from "../../core/process-runner.js";

export class NodeProcessRunner implements ProcessRunner {
  public async run(
    command: string,
    args: readonly string[],
    options: ProcessRunOptions = {}
  ): Promise<ProcessRunResult> {
    return new Promise<ProcessRunResult>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        env: options.env,
        stdio: ["ignore", "pipe", "pipe"]
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout.on("data", (chunk: Buffer) => {
        stdoutChunks.push(chunk);
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderrChunks.push(chunk);
      });

      child.on("error", (error) => {
        reject(
          new InfrastructureError(
            `Failed to run command: ${this.formatCommand(command, args)}`,
            error
          )
        );
      });

      child.on("close", (exitCode) => {
        const stdout = Buffer.concat(stdoutChunks).toString("utf8");
        const stderr = Buffer.concat(stderrChunks).toString("utf8");

        if (exitCode !== 0) {
          reject(
            new InfrastructureError(
              [
                `Command exited with status ${String(exitCode)}.`,
                `Command: ${this.formatCommand(command, args)}`,
                stderr.trim() ? `stderr: ${stderr.trim()}` : "",
                stdout.trim() ? `stdout: ${stdout.trim()}` : ""
              ]
                .filter((line) => line.length > 0)
                .join("\n")
            )
          );
          return;
        }

        resolve({
          stdout,
          stderr
        });
      });
    });
  }

  private formatCommand(command: string, args: readonly string[]): string {
    return [command, ...args].join(" ");
  }
}
