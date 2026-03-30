import type { PlannedEdge, PlannedRoute } from "../handlers/base.ts";

function edgeSignature(edge: PlannedEdge): string {
  return `${edge.handler.name}:${edge.from.id}->${edge.to.id}`;
}

function prefixSignature(edges: PlannedEdge[]): string {
  return edges.map((edge) => edgeSignature(edge)).join("|");
}

export class DeadEndTracker {
  private readonly deadPrefixes = new Set<string>();

  markDeadPrefix(edges: PlannedEdge[]): void {
    if (edges.length === 0) {
      return;
    }
    this.deadPrefixes.add(prefixSignature(edges));
  }

  routeBlocked(route: PlannedRoute): boolean {
    for (let index = 0; index < route.edges.length; index += 1) {
      const prefix = route.edges.slice(0, index + 1);
      const signature = prefixSignature(prefix);
      if (this.deadPrefixes.has(signature)) {
        return true;
      }
    }
    return false;
  }
}
