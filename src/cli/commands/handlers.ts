import { BundleResolver } from "../../bundle/resolve.ts";
import { ConsoleLogger } from "../../core/logger.ts";
import { Workspace } from "../../executor/workspace.ts";
import { HandlerRegistry } from "../../handlers/registry.ts";

export async function runHandlersCommand(input: {
  json: boolean;
  verbose: boolean;
  quiet: boolean;
  timeoutMs?: number;
}): Promise<void> {
  const logger = new ConsoleLogger(input.verbose, input.quiet);
  const workspace = await Workspace.create();
  const bundle = new BundleResolver();
  const handlers = new HandlerRegistry();

  try {
    await handlers.init({
      workspace,
      bundle,
      logger,
      timeoutMs: input.timeoutMs,
    });

    const status = handlers.status();
    if (input.json) {
      console.log(JSON.stringify({ ok: true, handlers: status }, null, 2));
      return;
    }

    for (const item of status) {
      console.log(`${item.name.padEnd(14)} ${item.available ? "available" : "missing"}`);
    }
  } finally {
    await workspace.cleanup(false);
  }
}
