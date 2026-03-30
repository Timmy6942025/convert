import type { ArtifactRef } from "../artifacts/artifact.ts";
import type { BundleResolver } from "../bundle/resolve.ts";
import type { Logger } from "../core/logger.ts";
import type { FileFormat } from "../core/types.ts";
import type { Workspace } from "../executor/workspace.ts";

export interface HandlerRule {
  from: string | "*";
  to: string | "*";
  cost?: number;
  lossless?: boolean;
}

export interface HandlerCapabilities {
  supportsAnyInput?: boolean;
  startupCost?: number;
  priority?: number;
  deterministic?: boolean;
}

export interface HandlerContext {
  workspace: Workspace;
  bundle: BundleResolver;
  logger: Logger;
  timeoutMs?: number;
}

export interface ConvertRequest {
  input: ArtifactRef;
  outputPath: string;
  inputFormat: FileFormat;
  outputFormat: FileFormat;
}

export interface HandlerResult {
  output: ArtifactRef;
  warnings?: string[];
}

export interface ConversionHandler {
  readonly name: string;
  readonly capabilities: HandlerCapabilities;
  readonly rules: HandlerRule[];

  init?(ctx: HandlerContext): Promise<void>;
  isAvailable?(ctx: HandlerContext): Promise<boolean>;
  convert(ctx: HandlerContext, request: ConvertRequest): Promise<HandlerResult>;
}

export interface PlannedEdge {
  handler: ConversionHandler;
  from: FileFormat;
  to: FileFormat;
  rule: HandlerRule;
  cost: number;
}

export interface PlannedRoute {
  edges: PlannedEdge[];
  totalCost: number;
}
