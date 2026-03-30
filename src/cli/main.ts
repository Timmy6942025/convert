#!/usr/bin/env bun

import { runConvertCommand } from "./commands/convert.ts";
import { runDoctorCommand } from "./commands/doctor.ts";
import { runFormatsCommand } from "./commands/formats.ts";
import { runHandlersCommand } from "./commands/handlers.ts";
import { runRouteCommand } from "./commands/route.ts";
import { CliError, ExitCode } from "../core/errors.ts";
import { parseArgs } from "./parse.ts";

function printUsage(): void {
  console.log("convert <input> <output> [--from fmt] [--to fmt]");
  console.log("convert route <input> --to <format>");
  console.log("convert formats");
  console.log("convert handlers");
  console.log("convert doctor");
}

async function main(): Promise<void> {
  const parsed = parseArgs(Bun.argv.slice(2));

  switch (parsed.command) {
    case "convert":
      await runConvertCommand({
        positionals: parsed.positionals,
        options: parsed.options,
      });
      return;
    case "route":
      await runRouteCommand({
        positionals: parsed.positionals,
        options: parsed.options,
      });
      return;
    case "formats":
      await runFormatsCommand(parsed.options.json);
      return;
    case "handlers":
      await runHandlersCommand({
        json: parsed.options.json,
        verbose: parsed.options.verbose,
        quiet: parsed.options.quiet,
        timeoutMs: parsed.options.timeoutMs,
      });
      return;
    case "doctor":
      await runDoctorCommand(parsed.options.json);
      return;
    default:
      throw new CliError(`Unknown command: ${parsed.command}`, ExitCode.InvalidArgs);
  }
}

main().catch((error: unknown) => {
  if (error instanceof CliError) {
    console.error(error.message);
    if (error.exitCode === ExitCode.InvalidArgs) {
      printUsage();
    }
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(ExitCode.InternalError);
});
