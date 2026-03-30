import type { FileFormat } from "../core/types.ts";
import type { ConversionHandler, HandlerRule } from "../handlers/base.ts";

const BASE_STEP_COST = 100;
const LOSSY_PENALTY = 80;
const ANY_INPUT_PENALTY = 140;
const BINARY_PENALTY = 140;

const CATEGORY_MATRIX = new Map<string, number>([
  ["text|document", 20],
  ["document|text", 20],
  ["image|vector", 35],
  ["vector|image", 35],
  ["image|document", 40],
  ["document|image", 40],
  ["audio|video", 30],
  ["video|audio", 30],
  ["data|text", 25],
  ["text|data", 25],
  ["data|code", 35],
  ["code|data", 35],
  ["document|presentation", 30],
  ["presentation|document", 30],
  ["document|spreadsheet", 35],
  ["spreadsheet|document", 35],
  ["font|binary", 40],
  ["binary|font", 40],
]);

function sameCategory(from: FileFormat, to: FileFormat): boolean {
  return from.category.some((category) => to.category.includes(category));
}

function minCategoryTransition(from: FileFormat, to: FileFormat): number {
  let min = Number.POSITIVE_INFINITY;
  for (const source of from.category) {
    for (const target of to.category) {
      if (source === target) {
        return 0;
      }
      const matrix = CATEGORY_MATRIX.get(`${source}|${target}`);
      if (typeof matrix === "number") {
        min = Math.min(min, matrix);
      }
    }
  }

  if (Number.isFinite(min)) {
    return min;
  }

  if (from.category.includes("archive") || to.category.includes("archive")) {
    return 90;
  }
  if (from.category.includes("binary") || to.category.includes("binary")) {
    return BINARY_PENALTY;
  }
  return 120;
}

export function categoriesCompatibleStrict(from: FileFormat, to: FileFormat): boolean {
  if (sameCategory(from, to)) {
    return true;
  }

  const compatibleClusters: string[][] = [
    ["text", "document", "data", "code"],
    ["image", "vector", "document"],
    ["audio", "video"],
  ];

  for (const cluster of compatibleClusters) {
    const hasFrom = from.category.some((value) => cluster.includes(value));
    const hasTo = to.category.some((value) => cluster.includes(value));
    if (hasFrom && hasTo) {
      return true;
    }
  }

  if (to.category.includes("archive") || from.category.includes("archive")) {
    return true;
  }

  return false;
}

export function edgeCost(
  handler: ConversionHandler,
  rule: HandlerRule,
  from: FileFormat,
  to: FileFormat,
): number {
  let cost = BASE_STEP_COST;
  cost += rule.cost ?? 0;
  cost += handler.capabilities.startupCost ?? 0;
  cost += minCategoryTransition(from, to);

  if (rule.from === "*" || handler.capabilities.supportsAnyInput) {
    cost += ANY_INPUT_PENALTY;
  }
  if (rule.lossless === false) {
    cost += LOSSY_PENALTY;
  }
  if (to.category.includes("binary")) {
    cost += BINARY_PENALTY;
  }

  const priority = handler.capabilities.priority ?? 0;
  cost += Math.max(0, 100 - priority);
  return Math.max(1, cost);
}
