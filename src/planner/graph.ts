import type { FileFormat } from "../core/types.ts";
import { FormatRegistry } from "../formats/registry.ts";
import type { ConversionHandler, PlannedEdge } from "../handlers/base.ts";
import { categoriesCompatibleStrict, edgeCost } from "./costs.ts";

export class ConversionGraph {
  private readonly adjacency = new Map<string, PlannedEdge[]>();

  constructor(
    private readonly registry: FormatRegistry,
    handlers: ConversionHandler[],
    strict: boolean,
  ) {
    this.build(handlers, strict);
  }

  private addEdge(edge: PlannedEdge): void {
    const list = this.adjacency.get(edge.from.id) ?? [];
    list.push(edge);
    this.adjacency.set(edge.from.id, list);
  }

  private resolveRuleTargets(ruleValue: string | "*", allFormats: FileFormat[]): FileFormat[] {
    if (ruleValue === "*") {
      return allFormats;
    }

    const format = this.registry.getById(ruleValue);
    if (!format) {
      return [];
    }
    return [format];
  }

  private build(handlers: ConversionHandler[], strict: boolean): void {
    const allFormats = this.registry.all();

    for (const handler of handlers) {
      for (const rule of handler.rules) {
        const fromCandidates = this.resolveRuleTargets(rule.from, allFormats);
        const toCandidates = this.resolveRuleTargets(rule.to, allFormats);

        for (const from of fromCandidates) {
          for (const to of toCandidates) {
            if (from.id === to.id) {
              continue;
            }
            if (strict && !categoriesCompatibleStrict(from, to)) {
              continue;
            }

            this.addEdge({
              handler,
              from,
              to,
              rule,
              cost: edgeCost(handler, rule, from, to),
            });
          }
        }
      }
    }
  }

  outgoing(formatId: string): PlannedEdge[] {
    return this.adjacency.get(formatId) ?? [];
  }
}
