import type { PlanOptions } from "./types.ts";

export const DEFAULT_MAX_STEPS = 6;
export const DEFAULT_MAX_CANDIDATES = 12;

export function buildPlanOptions(options: {
  strict: boolean;
  maxSteps: number;
  maxCandidates: number;
}): PlanOptions {
  return {
    strict: options.strict,
    maxSteps: options.maxSteps,
    maxCandidates: options.maxCandidates,
  };
}
