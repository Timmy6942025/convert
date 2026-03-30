import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import type { HandlerContext, HandlerResult, ConversionHandler, ConvertRequest, HandlerRule } from "../base.ts";
import { runCommand } from "../exec.ts";
import { CliError, ExitCode } from "../../core/errors.ts";
import { toFileArtifact } from "../../artifacts/file.ts";

const AUDIO = [
  "wav",
  "mp3",
  "flac",
  "ogg",
  "aac",
  "m4a",
  "wma",
  "aiff",
  "opus",
  "amr",
  "ac3",
  "dts",
  "mka",
  "mid",
];

const VIDEO = [
  "mp4",
  "m4v",
  "mov",
  "webm",
  "wmv",
  "mkv",
  "avi",
  "mpeg",
  "3gp",
  "3g2",
  "flv",
  "ts",
  "vob",
  "ogv",
  "asf",
  "gif",
];

const IMAGE = ["png", "jpeg", "webp", "bmp", "tiff", "gif", "avif", "jp2", "apng"];

function pairRules(from: string[], to: string[], cost: number): HandlerRule[] {
  const rules: HandlerRule[] = [];
  for (const src of from) {
    for (const dst of to) {
      if (src === dst) {
        continue;
      }
      rules.push({ from: src, to: dst, cost, lossless: false });
    }
  }
  return rules;
}

export class FfmpegHandler implements ConversionHandler {
  readonly name = "ffmpeg";
  readonly capabilities = {
    startupCost: 30,
    priority: 90,
    deterministic: true,
  };

  readonly rules: HandlerRule[] = [
    ...pairRules(AUDIO, AUDIO, 15),
    ...pairRules(VIDEO, VIDEO, 20),
    ...pairRules(IMAGE, IMAGE, 10),
    ...pairRules(VIDEO, AUDIO, 25),
    ...pairRules(AUDIO, VIDEO, 70),
    ...pairRules(VIDEO, IMAGE, 30),
    ...pairRules(IMAGE, VIDEO, 40),
  ];

  async isAvailable(ctx: HandlerContext): Promise<boolean> {
    const resolved = await ctx.bundle.resolveBinary("ffmpeg");
    return Boolean(resolved);
  }

  async convert(ctx: HandlerContext, request: ConvertRequest): Promise<HandlerResult> {
    const ffmpeg = await ctx.bundle.mustResolveBinary("ffmpeg");
    await mkdir(dirname(request.outputPath), { recursive: true });

    const args = [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      request.input.path,
    ];

    if (request.outputFormat.category.includes("image")) {
      args.push("-frames:v", "1");
    }

    args.push(request.outputPath);
    const result = await runCommand(ffmpeg, args, ctx.timeoutMs);

    if (result.exitCode !== 0) {
      throw new CliError(
        `ffmpeg failed (${request.inputFormat.id} -> ${request.outputFormat.id}): ${result.stderr || result.stdout}`,
        ExitCode.ConversionFailed,
      );
    }

    return { output: await toFileArtifact(request.outputPath) };
  }
}
