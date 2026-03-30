import type { PlannedRoute } from "../handlers/base.ts";

export function explainRoute(route: PlannedRoute): string[] {
  return route.edges.map((edge) => `${edge.handler.name}:${edge.from.id}->${edge.to.id}`);
}

export function describeRoutes(routes: PlannedRoute[], limit = 5): string[] {
  return routes.slice(0, limit).map((route, index) => {
    const path = explainRoute(route).join(" | ");
    return `${index + 1}. cost=${route.totalCost} ${path}`;
  });
}
