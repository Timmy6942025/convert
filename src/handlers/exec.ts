import { CliError, ExitCode } from "../core/errors.ts";
import { spawn } from "node:child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCommand(
  command: string,
  args: string[],
  timeoutMs?: number,
): Promise<ExecResult> {
  const proc = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdoutBuffers: Buffer[] = [];
  let stderrBuffers: Buffer[] = [];

  proc.stdout?.on("data", (chunk: Buffer) => stdoutBuffers.push(chunk));
  proc.stderr?.on("data", (chunk: Buffer) => stderrBuffers.push(chunk));

  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs && timeoutMs > 0) {
    timer = setTimeout(() => {
      timedOut = true;
      proc.kill();
    }, timeoutMs);
  }

  const exitCode: number = await new Promise((resolve, reject) => {
    proc.on("error", reject);
    proc.on("exit", (code) => resolve(code ?? 0));
  });

  if (timer) {
    clearTimeout(timer);
  }

  if (timedOut) {
    throw new CliError(`Command timed out: ${command}`, ExitCode.ConversionFailed);
  }

  return {
    stdout: Buffer.concat(stdoutBuffers).toString("utf8"),
    stderr: Buffer.concat(stderrBuffers).toString("utf8"),
    exitCode,
  };
}
