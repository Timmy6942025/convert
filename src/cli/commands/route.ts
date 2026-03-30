import { BundleResolver } from "../../bundle/resolve.ts";
import { buildPlanOptions } from "../../core/config.ts";
import { CliError, ExitCode } from "../../core/errors.ts";
import { ConsoleLogger } from "../../core/logger.ts";
import { detectInputFormat, resolveOutputFormat } from "../../formats/detect.ts";
import { FormatRegistry } from "../../formats/registry.ts";
import { HandlerRegistry } from "../../handlers/registry.ts";
import { describeRoutes } from "../../planner/explain.ts";
import { ConversionEngine } from "../../executor/executor.ts";

export async function runRouteCommand(input: {
  positionals: string[];
  options: {
    from?: string;
    to?: string;
    output?: string;
    strict: boolean;
    json: boolean;
    verbose: boolean;
    quiet: boolean;
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
    throw new CliError("Usage: convert route <input> --to <format>", ExitCode.InvalidArgs);
  }
  if (!input.options.to && !outputPath) {
    throw new CliError("Missing target format: provide --to or output path", ExitCode.InvalidArgs);
  }

  const formats = new FormatRegistry();
  const inputFormat = detectInputFormat(inputPath, input.options.from, formats);
  const outputFormat = resolveOutputFormat(outputPath, input.options.to, formats);

  const bundle = new BundleResolver();
  const handlers = new HandlerRegistry();
  const engine = new ConversionEngine(formats, handlers, bundle, logger);

  const planned = await engine.planRoutes(
    inputFormat,
    outputFormat,
    input.options.strict,
    buildPlanOptions({
      strict: input.options.strict,
      maxSteps: input.options.maxSteps,
      maxCandidates: input.options.maxCandidates,
    }),
    input.options.timeoutMs,
  );

  try {
    if (input.options.json) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            from: inputFormat.id,
            to: outputFormat.id,
            routes: planned.routes.map((route) => ({
              totalCost: route.totalCost,
              steps: route.edges.map((edge) => `${edge.handler.name}:${edge.from.id}->${edge.to.id}`),
            })),
          },
          null,
          2,
        ),
      );
      return;
    }

    if (planned.routes.length === 0) {
      logger.info(`no route found for ${inputFormat.id} -> ${outputFormat.id}`);
      return;
    }

    logger.info(`routes for ${inputFormat.id} -> ${outputFormat.id}`);
    for (const line of describeRoutes(planned.routes, 10)) {
      logger.info(line);
    }
  } finally {
    await planned.workspace.cleanup(false);
  }
}
