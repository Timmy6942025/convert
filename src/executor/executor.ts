import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import type { ArtifactRef } from "../artifacts/artifact.ts";
import type { BundleResolver } from "../bundle/resolve.ts";
import { CliError, ExitCode } from "../core/errors.ts";
import type { Logger } from "../core/logger.ts";
import type { FileFormat, PlanOptions } from "../core/types.ts";
import { FormatRegistry } from "../formats/registry.ts";
import type { HandlerContext, PlannedRoute } from "../handlers/base.ts";
import { HandlerRegistry } from "../handlers/registry.ts";
import { DeadEndTracker } from "../planner/deadends.ts";
import { ConversionGraph } from "../planner/graph.ts";
import { findRoutes } from "../planner/search.ts";
import { Workspace } from "./workspace.ts";

export interface EngineInput {
  inputPath: string;
  outputPath: string;
  inputFormat: FileFormat;
  outputFormat: FileFormat;
  strict: boolean;
  keepTemp: boolean;
  timeoutMs?: number;
  plan: PlanOptions;
}

export interface EngineResult {
  route: PlannedRoute;
  outputPath: string;
  durationMs: number;
  warnings: string[];
}

export class ConversionEngine {
  constructor(
    private readonly formats: FormatRegistry,
    private readonly handlers: HandlerRegistry,
    private readonly bundle: BundleResolver,
    private readonly logger: Logger,
  ) {}

  private async validateInput(path: string): Promise<void> {
    try {
      const fileStat = await stat(path);
      if (!fileStat.isFile()) {
        throw new CliError(`Input is not a file: ${path}`, ExitCode.InvalidArgs);
      }
    } catch (error) {
      if (error instanceof CliError) {
        throw error;
      }
      throw new CliError(`Input file not found: ${path}`, ExitCode.InvalidArgs);
    }
  }

  async planRoutes(
    inputFormat: FileFormat,
    outputFormat: FileFormat,
    strict: boolean,
    plan: PlanOptions,
    timeoutMs?: number,
  ): Promise<{ workspace: Workspace; routes: PlannedRoute[] }> {
    const workspace = await Workspace.create();
    await this.handlers.init({
      workspace,
      bundle: this.bundle,
      logger: this.logger,
      timeoutMs,
    });

    const graph = new ConversionGraph(this.formats, this.handlers.availableHandlers(), strict);
    const routes = findRoutes(graph, inputFormat.id, outputFormat.id, plan);
    return { workspace, routes };
  }

  async execute(input: EngineInput): Promise<EngineResult> {
    const startedAt = Date.now();
    await this.validateInput(input.inputPath);

    const { workspace, routes } = await this.planRoutes(
      input.inputFormat,
      input.outputFormat,
      input.strict,
      input.plan,
      input.timeoutMs,
    );

    const deadEnds = new DeadEndTracker();
    const warnings: string[] = [];

    try {
      if (routes.length === 0) {
        throw new CliError(
          `No route found from ${input.inputFormat.id} to ${input.outputFormat.id}`,
          ExitCode.UnsupportedRoute,
        );
      }

      for (const route of routes) {
        if (deadEnds.routeBlocked(route)) {
          continue;
        }

        const routeAttempt = await this.tryRoute(route, input, workspace, warnings);
        if (routeAttempt.failedPrefix) {
          deadEnds.markDeadPrefix(routeAttempt.failedPrefix);
          continue;
        }

        if (routeAttempt.artifact) {
          await workspace.cleanup(input.keepTemp);
          return {
            route,
            outputPath: routeAttempt.artifact.path,
            durationMs: Date.now() - startedAt,
            warnings,
          };
        }
      }

      throw new CliError("All candidate routes failed", ExitCode.ConversionFailed);
    } catch (error) {
      await workspace.cleanup(input.keepTemp);
      throw error;
    }

  }

  private async tryRoute(
    route: PlannedRoute,
    input: EngineInput,
    workspace: Workspace,
    warnings: string[],
  ): Promise<{ artifact?: ArtifactRef; failedPrefix?: PlannedRoute["edges"] }> {
    const inputCopy = join(workspace.inputDir, `source${extname(input.inputPath)}`);
    await copyFile(input.inputPath, inputCopy);
    let currentArtifact: ArtifactRef = { kind: "file", path: inputCopy };

    const context: HandlerContext = {
      workspace,
      bundle: this.bundle,
      logger: this.logger,
      timeoutMs: input.timeoutMs,
    };

    for (let index = 0; index < route.edges.length; index += 1) {
      const edge = route.edges[index];
      if (!edge) {
        return { failedPrefix: route.edges.slice(0, index) };
      }

      const stepDir = await workspace.ensureStepDir(index);
      const outputPath = join(stepDir, `output.${edge.to.extension}`);
      const prefix = route.edges.slice(0, index + 1);

      try {
        const result = await edge.handler.convert(context, {
          input: currentArtifact,
          outputPath,
          inputFormat: edge.from,
          outputFormat: edge.to,
        });
        currentArtifact = result.output;
        if (result.warnings && result.warnings.length > 0) {
          warnings.push(...result.warnings);
        }
      } catch (error) {
        this.logger.debug(`Route failed at step ${index + 1}: ${(error as Error).message}`);
        return { failedPrefix: prefix };
      }
    }

    await mkdir(dirname(input.outputPath), { recursive: true });
    await copyFile(currentArtifact.path, input.outputPath);
    return { artifact: { kind: "file", path: input.outputPath } };
  }
}
