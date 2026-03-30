import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import type { ConversionHandler, ConvertRequest, HandlerContext, HandlerResult, HandlerRule } from "../base.ts";
import { runCommand } from "../exec.ts";
import { CliError, ExitCode } from "../../core/errors.ts";
import { toFileArtifact } from "../../artifacts/file.ts";

const IMAGE_DOC = ["png", "jpeg", "webp", "bmp", "tiff", "gif", "svg", "pdf"];

function imageRules(): HandlerRule[] {
  const rules: HandlerRule[] = [];
  for (const from of IMAGE_DOC) {
    for (const to of IMAGE_DOC) {
      if (from === to) {
        continue;
      }
      rules.push({ from, to, cost: 18, lossless: false });
    }
  }
  return rules;
}

export class ImageMagickHandler implements ConversionHandler {
  readonly name = "imagemagick";
  readonly capabilities = {
    startupCost: 20,
    priority: 80,
    deterministic: true,
  };

  readonly rules: HandlerRule[] = imageRules();

  private async resolveMagick(ctx: HandlerContext): Promise<string | undefined> {
    const magick = await ctx.bundle.resolveBinary("magick");
    if (magick) {
      return magick;
    }
    return ctx.bundle.resolveBinary("convert");
  }

  async isAvailable(ctx: HandlerContext): Promise<boolean> {
    const executable = await this.resolveMagick(ctx);
    return Boolean(executable);
  }

  async convert(ctx: HandlerContext, request: ConvertRequest): Promise<HandlerResult> {
    const magick = await this.resolveMagick(ctx);
    if (!magick) {
      throw new CliError("ImageMagick executable not found", ExitCode.EnvironmentError);
    }

    await mkdir(dirname(request.outputPath), { recursive: true });

    const args = [request.input.path, request.outputPath];
    const result = await runCommand(magick, args, ctx.timeoutMs);
    if (result.exitCode !== 0) {
      throw new CliError(
        `ImageMagick failed (${request.inputFormat.id} -> ${request.outputFormat.id}): ${result.stderr || result.stdout}`,
        ExitCode.ConversionFailed,
      );
    }

    return { output: await toFileArtifact(request.outputPath) };
  }
}
