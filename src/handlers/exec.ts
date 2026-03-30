import { CliError, ExitCode } from "../core/errors.ts";

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
  const proc = Bun.spawn([command, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs && timeoutMs > 0) {
    timer = setTimeout(() => {
      timedOut = true;
      proc.kill();
    }, timeoutMs);
  }

  const [stdoutBuf, stderrBuf, exitCode] = await Promise.all([
    new Response(proc.stdout).arrayBuffer(),
    new Response(proc.stderr).arrayBuffer(),
    proc.exited,
  ]);

  if (timer) {
    clearTimeout(timer);
  }

  if (timedOut) {
    throw new CliError(`Command timed out: ${command}`, ExitCode.ConversionFailed);
  }

  return {
    stdout: Buffer.from(stdoutBuf).toString("utf8"),
    stderr: Buffer.from(stderrBuf).toString("utf8"),
    exitCode,
  };
}
