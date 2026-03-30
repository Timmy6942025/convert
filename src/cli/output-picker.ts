import { basename, dirname, extname, join } from "node:path";
import { createInterface } from "node:readline";
import { CliError, ExitCode } from "../core/errors.ts";
import type { FileFormat } from "../core/types.ts";

// Minimal, in-process interactive output picker
// Replaces the external fconvert-picker binary with a simple Node-based UI.
// Keeps the contract: pickOutputFormatInteractive(formats, inputPath): Promise<FileFormat>
export function buildDefaultOutputPath(inputPath: string, outputFormat: FileFormat): string {
  const inputDirectory = dirname(inputPath);
  const inputName = basename(inputPath);
  const currentExtension = extname(inputName);
  const baseName = currentExtension.length > 0 ? inputName.slice(0, -currentExtension.length) : inputName;
  return join(inputDirectory, `${baseName}.${outputFormat.extension}`);
}

// NOTE: We intentionally keep imports minimal and avoid any external binary dependencies.
// We rely on a simple numbered list prompt and the user's input in the terminal.
export async function pickOutputFormatInteractive(
  formats: FileFormat[],
  inputPath: string,
): Promise<FileFormat> {
  const stdinIsTTY = typeof process.stdin?.isTTY === "boolean" ? process.stdin.isTTY : false;
  const stdoutIsTTY = typeof process.stdout?.isTTY === "boolean" ? process.stdout.isTTY : false;
  if (!stdinIsTTY || !stdoutIsTTY) {
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

  const preferredExtension = extname(inputPath).replace(/^\./, "");

  console.log(`Available output formats for ${basename(inputPath)}:`);
  formats.forEach((f, idx) => {
    const ext = f.extension ? `.${f.extension}` : "";
    const preferredMarker = preferredExtension !== "" && f.extension === preferredExtension ? " (recommended)" : "";
    console.log(`  ${idx + 1}) ${f.name}${ext}  [${f.id}]${preferredMarker}`);
  });

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const ask = (prompt: string) =>
    new Promise<string>((resolve) => rl.question(prompt, (ans) => resolve(ans)));

  try {
    while (true) {
      const raw = await ask(`Enter selection (1-${formats.length}, or id): `);
      const trimmed = raw.trim();

      const idx = Number(trimmed);
      if (Number.isFinite(idx) && Number.isInteger(idx) && idx >= 1 && idx <= formats.length) {
        const selected = formats[idx - 1];
        if (selected) {
          return selected;
        }
      }

      const byId = formats.find((f) => f.id === trimmed);
      if (byId) {
        return byId;
      }

      console.log(`Invalid selection. Please enter a number between 1 and ${formats.length}, or a valid format id.`);
    }
  } finally {
    rl.close();
  }
}
