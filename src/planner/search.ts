import type { PlanOptions } from "../core/types.ts";
import type { PlannedRoute } from "../handlers/base.ts";
import { ConversionGraph } from "./graph.ts";

interface SearchState {
  node: string;
  cost: number;
  edges: PlannedRoute["edges"];
  visited: Set<string>;
}

function routeSignature(route: PlannedRoute): string {
  return route.edges
    .map((edge) => `${edge.handler.name}:${edge.from.id}->${edge.to.id}`)
    .join("|");
}

export function findRoutes(
  graph: ConversionGraph,
  fromId: string,
  toId: string,
  options: PlanOptions,
): PlannedRoute[] {
  const queue: SearchState[] = [
    {
      node: fromId,
      cost: 0,
      edges: [],
      visited: new Set([fromId]),
    },
  ];
  const routes: PlannedRoute[] = [];
  const seen = new Set<string>();

  while (queue.length > 0 && routes.length < options.maxCandidates) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current.node === toId && current.edges.length > 0) {
      const route: PlannedRoute = {
        edges: current.edges,
        totalCost: current.cost,
      };
      const signature = routeSignature(route);
      if (!seen.has(signature)) {
        routes.push(route);
        seen.add(signature);
      }
      continue;
    }

    if (current.edges.length >= options.maxSteps) {
      continue;
    }

    for (const edge of graph.outgoing(current.node)) {
      if (current.visited.has(edge.to.id)) {
        continue;
      }

      const nextVisited = new Set(current.visited);
      nextVisited.add(edge.to.id);

      queue.push({
        node: edge.to.id,
        cost: current.cost + edge.cost,
        edges: [...current.edges, edge],
        visited: nextVisited,
      });
    }
  }

  return routes.sort((a, b) => a.totalCost - b.totalCost);
}
