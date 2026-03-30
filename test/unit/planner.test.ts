import { expect, test } from "bun:test";
import { FormatRegistry } from "../../src/formats/registry.ts";
import { ConversionGraph } from "../../src/planner/graph.ts";
import { findRoutes } from "../../src/planner/search.ts";
import type { ConversionHandler, ConvertRequest, HandlerContext, HandlerResult } from "../../src/handlers/base.ts";

class MockHandler implements ConversionHandler {
  readonly name: string;
  readonly capabilities = { startupCost: 0, priority: 80, deterministic: true };
  readonly rules;

  constructor(name: string, rules: ConversionHandler["rules"]) {
    this.name = name;
    this.rules = rules;
  }

  async convert(_ctx: HandlerContext, request: ConvertRequest): Promise<HandlerResult> {
    return {
      output: {
        kind: "file",
        path: request.outputPath,
      },
    };
  }
}

test("planner prefers meaningful route over wildcard", () => {
  const registry = new FormatRegistry();

  const handlers: ConversionHandler[] = [
    new MockHandler("image-audio-bridge", [{ from: "png", to: "wav", cost: 10 }]),
    new MockHandler("audio-encoder", [{ from: "wav", to: "mp3", cost: 10 }]),
    new MockHandler("wildcard", [{ from: "*", to: "*", cost: 400 }]),
  ];

  const graph = new ConversionGraph(registry, handlers, false);
  const routes = findRoutes(graph, "png", "mp3", {
    strict: false,
    maxSteps: 4,
    maxCandidates: 5,
  });

  expect(routes.length).toBeGreaterThan(0);
  const first = routes[0];
  expect(first?.edges.map((edge) => edge.handler.name)).toEqual(["image-audio-bridge", "audio-encoder"]);
});
