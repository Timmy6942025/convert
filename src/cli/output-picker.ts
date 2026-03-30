import { constants as fsConstants, realpathSync } from "node:fs";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join } from "node:path";
import { CliError, ExitCode } from "../core/errors.ts";
import type { FileFormat } from "../core/types.ts";
import { FormatRegistry } from "../formats/registry.ts";

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

async function resolvePickerBinary(): Promise<string | undefined> {
  const envPath = process.env.FCONVERT_PICKER_BIN;
  if (envPath && (await pathExists(envPath))) {
    return envPath;
  }

  let execDir = dirname(process.execPath);
  let argv0Dir = dirname(Bun.argv[0] ?? process.cwd());
  const argv1Dir = dirname(Bun.argv[1] ?? process.cwd());

  try {
    execDir = dirname(realpathSync(process.execPath));
  } catch {
    execDir = dirname(process.execPath);
  }

  try {
    argv0Dir = dirname(realpathSync(Bun.argv[0] ?? process.cwd()));
  } catch {
    argv0Dir = dirname(Bun.argv[0] ?? process.cwd());
  }

  const candidates = [
    join(process.cwd(), "dist", "fconvert-picker"),
    join(execDir, "fconvert-picker"),
    join(execDir, "dist", "fconvert-picker"),
    join(argv0Dir, "fconvert-picker"),
    join(argv0Dir, "dist", "fconvert-picker"),
    join(argv1Dir, "..", "dist", "fconvert-picker"),
  ].map(withExecutableSuffix);

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  const inPath = Bun.which("fconvert-picker");
  if (inPath) {
    return inPath;
  }

  return undefined;
}

export function buildDefaultOutputPath(inputPath: string, outputFormat: FileFormat): string {
  const inputDirectory = dirname(inputPath);
  const inputName = basename(inputPath);
  const currentExtension = extname(inputName);
  const baseName = currentExtension.length > 0 ? inputName.slice(0, -currentExtension.length) : inputName;
  return join(inputDirectory, `${baseName}.${outputFormat.extension}`);
}

export async function pickOutputFormatInteractive(
  registry: FormatRegistry,
  inputPath: string,
): Promise<FileFormat> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new CliError(
      "No output format provided and terminal is not interactive. Pass <output> or --to.",
      ExitCode.InvalidArgs,
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
    options: registry.all().map((format) => ({
      id: format.id,
      name: format.name,
      extension: format.extension,
    })),
  };

  try {
    await writeFile(optionsPath, JSON.stringify(payload), "utf8");

    const processHandle = Bun.spawn(
      [pickerBinary, "--options", optionsPath, "--result", resultPath],
      {
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      },
    );

    const exitCode = await processHandle.exited;
    if (exitCode === 130) {
      throw new CliError("Output format selection cancelled", ExitCode.InvalidArgs);
    }
    if (exitCode !== 0) {
      throw new CliError(`Output picker exited with code ${exitCode}`, ExitCode.InternalError);
    }

    const chosenId = (await readFile(resultPath, "utf8")).trim();
    const format = registry.getById(chosenId);
    if (!format) {
      throw new CliError(`Picker returned unknown format: ${chosenId}`, ExitCode.InternalError);
    }
    return format;
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}
