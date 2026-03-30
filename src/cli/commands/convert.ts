import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { BundleResolver } from "../../bundle/resolve.ts";
import { buildPlanOptions } from "../../core/config.ts";
import { CliError, ExitCode } from "../../core/errors.ts";
import { ConsoleLogger } from "../../core/logger.ts";
import type { ConvertSummary } from "../../core/types.ts";
import { ConversionEngine } from "../../executor/executor.ts";
import { detectInputFormat, resolveOutputFormat } from "../../formats/detect.ts";
import { FormatRegistry } from "../../formats/registry.ts";
import { HandlerRegistry } from "../../handlers/registry.ts";
import { explainRoute } from "../../planner/explain.ts";

async function outputExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function runConvertCommand(input: {
  positionals: string[];
  options: {
    from?: string;
    to?: string;
    output?: string;
    force: boolean;
    strict: boolean;
    json: boolean;
    verbose: boolean;
    quiet: boolean;
    showRoute: boolean;
    keepTemp: boolean;
    timeoutMs?: number;
    maxSteps: number;
    maxCandidates: number;
  };
}): Promise<void> {
  const logger = new ConsoleLogger(input.options.verbose, input.options.quiet);

  const inputPath = input.positionals[0];
  const positionalOutput = input.positionals[1];
  const outputPath = input.options.output ?? positionalOutput;

  if (!inputPath) {
    throw new CliError("Usage: convert <input> <output> [--from fmt] [--to fmt]", ExitCode.InvalidArgs);
  }

  if (!outputPath) {
    throw new CliError("Missing output path. Provide <output> or --output", ExitCode.InvalidArgs);
  }

  if ((await outputExists(outputPath)) && !input.options.force) {
    throw new CliError(`Output exists: ${outputPath}. Use --force to overwrite.`, ExitCode.InvalidArgs);
  }

  const formats = new FormatRegistry();
  const inputFormat = detectInputFormat(inputPath, input.options.from, formats);
  const outputFormat = resolveOutputFormat(outputPath, input.options.to, formats);

  const bundle = new BundleResolver();
  const handlers = new HandlerRegistry();
  const engine = new ConversionEngine(formats, handlers, bundle, logger);

  const result = await engine.execute({
    inputPath,
    outputPath,
    inputFormat,
    outputFormat,
    strict: input.options.strict,
    keepTemp: input.options.keepTemp,
    timeoutMs: input.options.timeoutMs,
    plan: buildPlanOptions({
      strict: input.options.strict,
      maxSteps: input.options.maxSteps,
      maxCandidates: input.options.maxCandidates,
    }),
  });

  const route = explainRoute(result.route);
  const summary: ConvertSummary = {
    ok: true,
    input: inputPath,
    output: result.outputPath,
    route,
    durationMs: result.durationMs,
    warnings: result.warnings,
  };

  if (input.options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  logger.info(`converted: ${inputPath} -> ${result.outputPath}`);
  logger.info(`duration: ${result.durationMs}ms`);
  if (input.options.showRoute || input.options.verbose) {
    logger.info(`route: ${route.join(" | ")}`);
  }
  for (const warning of result.warnings) {
    logger.warn(`warning: ${warning}`);
  }
}
