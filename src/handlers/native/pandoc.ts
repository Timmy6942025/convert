import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import type { ConversionHandler, ConvertRequest, HandlerContext, HandlerResult, HandlerRule } from "../base.ts";
import { runCommand } from "../exec.ts";
import { CliError, ExitCode } from "../../core/errors.ts";
import { toFileArtifact } from "../../artifacts/file.ts";

const DOC_TEXT_DATA = [
  "txt",
  "md",
  "rst",
  "adoc",
  "bbcode",
  "org",
  "tex",
  "texinfo",
  "html",
  "xhtml",
  "json",
  "xml",
  "yaml",
  "toml",
  "csv",
  "tsv",
  "pdf",
  "docx",
  "odt",
  "rtf",
  "epub",
  "fb2",
  "pptx",
  "xlsx",
  "ods",
  "odp",
  "docbook",
  "jats",
];

function pandocRules(): HandlerRule[] {
  const rules: HandlerRule[] = [];
  for (const from of DOC_TEXT_DATA) {
    for (const to of DOC_TEXT_DATA) {
      if (from === to) {
        continue;
      }
      rules.push({ from, to, cost: 26, lossless: false });
    }
  }
  return rules;
}

export class PandocHandler implements ConversionHandler {
  readonly name = "pandoc";
  readonly capabilities = {
    startupCost: 40,
    priority: 85,
    deterministic: true,
  };

  readonly rules: HandlerRule[] = pandocRules();

  async isAvailable(ctx: HandlerContext): Promise<boolean> {
    const resolved = await ctx.bundle.resolveBinary("pandoc");
    return Boolean(resolved);
  }

  async convert(ctx: HandlerContext, request: ConvertRequest): Promise<HandlerResult> {
    const pandoc = await ctx.bundle.mustResolveBinary("pandoc");
    await mkdir(dirname(request.outputPath), { recursive: true });

    const args = [request.input.path, "-o", request.outputPath];
    const result = await runCommand(pandoc, args, ctx.timeoutMs);

    if (result.exitCode !== 0) {
      throw new CliError(
        `pandoc failed (${request.inputFormat.id} -> ${request.outputFormat.id}): ${result.stderr || result.stdout}`,
        ExitCode.ConversionFailed,
      );
    }

    return { output: await toFileArtifact(request.outputPath) };
  }
}
