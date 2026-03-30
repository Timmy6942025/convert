import { copyFile, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ConversionHandler, ConvertRequest, HandlerContext, HandlerResult, HandlerRule } from "../base.ts";
import { runCommand } from "../exec.ts";
import { CliError, ExitCode } from "../../core/errors.ts";
import { toFileArtifact } from "../../artifacts/file.ts";

const ARCHIVES = new Set(["zip", "tar", "7z", "gz", "bz2", "xz", "rar", "cab", "iso"]);
const WRITE_ARCHIVES = ["zip", "tar", "7z", "gz", "bz2", "xz", "rar", "cab", "iso"];
const READ_ARCHIVES = ["zip", "tar", "7z", "gz", "bz2", "xz", "rar", "cab", "iso"];

async function findFirstFile(root: string): Promise<string | undefined> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const candidate = join(root, entry.name);
    if (entry.isFile()) {
      return candidate;
    }
    if (entry.isDirectory()) {
      const nested = await findFirstFile(candidate);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
}

function sevenZipRules(): HandlerRule[] {
  const rules: HandlerRule[] = [];
  for (const archive of WRITE_ARCHIVES) {
    rules.push({ from: "*", to: archive, cost: 95, lossless: false });
  }
  for (const archive of READ_ARCHIVES) {
    rules.push({ from: archive, to: "*", cost: 145, lossless: false });
  }
  return rules;
}

export class SevenZipHandler implements ConversionHandler {
  readonly name = "7zip";
  readonly capabilities = {
    startupCost: 15,
    priority: 60,
    deterministic: true,
    supportsAnyInput: true,
  };

  readonly rules: HandlerRule[] = sevenZipRules();

  private async resolve7z(ctx: HandlerContext): Promise<string | undefined> {
    const candidates = ["7zz", "7z"];
    for (const candidate of candidates) {
      const resolved = await ctx.bundle.resolveBinary(candidate);
      if (resolved) {
        return resolved;
      }
    }
    return undefined;
  }

  async isAvailable(ctx: HandlerContext): Promise<boolean> {
    const binary = await this.resolve7z(ctx);
    return Boolean(binary);
  }

  async convert(ctx: HandlerContext, request: ConvertRequest): Promise<HandlerResult> {
    const sevenZip = await this.resolve7z(ctx);
    if (!sevenZip) {
      throw new CliError("7zip executable not found", ExitCode.EnvironmentError);
    }

    await mkdir(dirname(request.outputPath), { recursive: true });
    await rm(request.outputPath, { force: true });

    const toArchive = ARCHIVES.has(request.outputFormat.id);
    const fromArchive = ARCHIVES.has(request.inputFormat.id);

    if (toArchive) {
      const archiveType = request.outputFormat.id;
      const args = ["a", "-y", `-t${archiveType}`, request.outputPath, request.input.path];
      const result = await runCommand(sevenZip, args, ctx.timeoutMs);
      if (result.exitCode !== 0) {
        throw new CliError(`7zip archive creation failed: ${result.stderr || result.stdout}`, ExitCode.ConversionFailed);
      }
      return { output: await toFileArtifact(request.outputPath) };
    }

    if (fromArchive) {
      const extractDir = join(ctx.workspace.outputDir, `extract-${Date.now()}`);
      await mkdir(extractDir, { recursive: true });
      const args = ["x", "-y", request.input.path, `-o${extractDir}`];
      const result = await runCommand(sevenZip, args, ctx.timeoutMs);
      if (result.exitCode !== 0) {
        throw new CliError(`7zip extraction failed: ${result.stderr || result.stdout}`, ExitCode.ConversionFailed);
      }

      const first = await findFirstFile(extractDir);
      if (!first) {
        await writeFile(request.outputPath, new Uint8Array());
      } else {
        const stats = await stat(first);
        if (stats.isFile()) {
          await copyFile(first, request.outputPath);
        } else {
          await writeFile(request.outputPath, new Uint8Array());
        }
      }
      return { output: await toFileArtifact(request.outputPath) };
    }

    throw new CliError(
      `7zip cannot convert ${request.inputFormat.id} -> ${request.outputFormat.id}`,
      ExitCode.ConversionFailed,
    );
  }
}
