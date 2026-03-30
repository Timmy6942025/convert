import { extname } from "node:path";
import { CliError, ExitCode } from "../core/errors.ts";
import type { FileFormat } from "../core/types.ts";
import { FormatRegistry } from "./registry.ts";

export function detectInputFormat(
  inputPath: string,
  override: string | undefined,
  registry: FormatRegistry,
): FileFormat {
  if (override) {
    const format = registry.getById(override);
    if (!format) {
      throw new CliError(`Unknown input format: ${override}`, ExitCode.InvalidArgs);
    }
    return format;
  }

  const extension = extname(inputPath).replace(/^\./, "").toLowerCase();
  if (extension) {
    const byExtension = registry.getByExtension(extension);
    if (byExtension) {
      return byExtension;
    }
  }

  const bin = registry.getById("bin");
  if (!bin) {
    throw new CliError("Binary fallback format is missing", ExitCode.InternalError);
  }
  return bin;
}

export function resolveOutputFormat(
  outputPath: string | undefined,
  override: string | undefined,
  registry: FormatRegistry,
): FileFormat {
  if (override) {
    const format = registry.getById(override);
    if (!format) {
      throw new CliError(`Unknown output format: ${override}`, ExitCode.InvalidArgs);
    }
    return format;
  }

  if (!outputPath) {
    throw new CliError("Missing output path or --to format", ExitCode.InvalidArgs);
  }

  const extension = extname(outputPath).replace(/^\./, "").toLowerCase();
  if (!extension) {
    throw new CliError("Could not infer output format from path; use --to", ExitCode.InvalidArgs);
  }

  const byExtension = registry.getByExtension(extension);
  if (!byExtension) {
    throw new CliError(`Unsupported output extension: .${extension}`, ExitCode.UnsupportedRoute);
  }

  return byExtension;
}
