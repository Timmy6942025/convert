import { constants as fsConstants, realpathSync } from "node:fs";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join } from "node:path";
import { spawn } from "node:child_process";
import { CliError, ExitCode } from "../core/errors.ts";
import type { FileFormat } from "../core/types.ts";

interface PickerPayload {
  prompt: string;
  query: string;
  preferred: string;
  options: Array<{
    id: string;
    name: string;
    extension: string;
  }>;
}

function withExecutableSuffix(path: string): string {
  if (process.platform === "win32") {
    return path.endsWith(".exe") ? path : `${path}.exe`;
  }
  return path;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function pathExecutable(path: string): Promise<boolean> {
  try {
    const mode = process.platform === "win32" ? fsConstants.F_OK : fsConstants.X_OK;
    await access(path, mode);
    return true;
  } catch {
    return false;
  }
}

async function findInPath(name: string): Promise<string | undefined> {
  const pathValue = process.env.PATH;
  if (!pathValue) {
    return undefined;
  }

  const separator = process.platform === "win32" ? ";" : ":";
  const parts = pathValue.split(separator).filter((value) => value.length > 0);
  for (const part of parts) {
    const candidate = withExecutableSuffix(join(part, name));
    if (await pathExecutable(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

async function resolvePickerBinary(): Promise<string | undefined> {
  const envPath = process.env.FCONVERT_PICKER_BIN;
  if (envPath && (await pathExecutable(envPath))) {
    return envPath;
  }

  let argv1Dir = dirname(process.argv[1] ?? process.cwd());
  try {
    argv1Dir = dirname(realpathSync(process.argv[1] ?? process.cwd()));
  } catch {
    argv1Dir = dirname(process.argv[1] ?? process.cwd());
  }

  const candidates = [
    join(process.cwd(), "dist", "fconvert-picker"),
    join(argv1Dir, "fconvert-picker"),
    join(argv1Dir, "..", "dist", "fconvert-picker"),
    join(argv1Dir, "..", "..", "dist", "fconvert-picker"),
  ].map(withExecutableSuffix);

  for (const candidate of candidates) {
    if (await pathExecutable(candidate)) {
      return candidate;
    }
  }

  return findInPath("fconvert-picker");
}

function runPickerProcess(
  pickerBinary: string,
  optionsPath: string,
  resultPath: string,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(pickerBinary, ["--options", optionsPath, "--result", resultPath], {
      stdio: "inherit",
    });

    child.on("error", (error) => reject(error));
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

export function buildDefaultOutputPath(inputPath: string, outputFormat: FileFormat): string {
  const inputDirectory = dirname(inputPath);
  const inputName = basename(inputPath);
  const currentExtension = extname(inputName);
  const baseName = currentExtension.length > 0 ? inputName.slice(0, -currentExtension.length) : inputName;
  return join(inputDirectory, `${baseName}.${outputFormat.extension}`);
}

export async function pickOutputFormatInteractive(
  formats: FileFormat[],
  inputPath: string,
): Promise<FileFormat> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new CliError(
      "No output format provided and terminal is not interactive. Pass <output> or --to.",
      ExitCode.InvalidArgs,
    );
  }

  if (formats.length === 0) {
    throw new CliError(
      "No reachable output formats detected for this input with current handlers.",
      ExitCode.UnsupportedRoute,
    );
  }

  const pickerBinary = await resolvePickerBinary();
  if (!pickerBinary) {
    throw new CliError(
      "Output picker binary not found. Reinstall fconvert or pass --to for non-interactive selection.",
      ExitCode.EnvironmentError,
    );
  }

  const tempRoot = await mkdtemp(join(tmpdir(), "fconvert-picker-"));
  const optionsPath = join(tempRoot, "options.json");
  const resultPath = join(tempRoot, "result.txt");

  const payload: PickerPayload = {
    prompt: "output format",
    query: "",
    preferred: extname(inputPath).replace(/^\./, ""),
    options: formats.map((format) => ({
      id: format.id,
      name: format.name,
      extension: format.extension,
    })),
  };

  try {
    await writeFile(optionsPath, JSON.stringify(payload), "utf8");
    const exitCode = await runPickerProcess(pickerBinary, optionsPath, resultPath);

    if (exitCode === 130) {
      throw new CliError("Output format selection cancelled", ExitCode.InvalidArgs);
    }
    if (exitCode !== 0) {
      throw new CliError(`Output picker exited with code ${exitCode}`, ExitCode.InternalError);
    }

    if (!(await pathExists(resultPath))) {
      throw new CliError("Output picker did not return a selection", ExitCode.InternalError);
    }

    const chosenId = (await readFile(resultPath, "utf8")).trim();
    const format = formats.find((item) => item.id === chosenId);
    if (!format) {
      throw new CliError(`Picker returned unknown format: ${chosenId}`, ExitCode.InternalError);
    }
    return format;
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}
