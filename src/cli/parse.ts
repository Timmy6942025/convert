import { CliError, ExitCode } from "../core/errors.ts";
import { DEFAULT_MAX_CANDIDATES, DEFAULT_MAX_STEPS } from "../core/config.ts";
import type { CliOptions } from "../core/types.ts";

export interface ParsedArgs {
  command: "convert" | "route" | "formats" | "handlers" | "doctor";
  positionals: string[];
  options: CliOptions;
}

function parseNumber(value: string | undefined, fallback: number, flagName: string): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new CliError(`Invalid ${flagName} value: ${value}`, ExitCode.InvalidArgs);
  }
  return parsed;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const raw = [...argv];
  const knownCommands = new Set(["convert", "route", "formats", "handlers", "doctor"]);

  let command: ParsedArgs["command"] = "convert";
  if (raw[0] && knownCommands.has(raw[0])) {
    command = raw.shift() as ParsedArgs["command"];
  }

  const options: CliOptions = {
    force: false,
    strict: false,
    json: false,
    verbose: false,
    quiet: false,
    showRoute: false,
    keepTemp: false,
    maxSteps: DEFAULT_MAX_STEPS,
    maxCandidates: DEFAULT_MAX_CANDIDATES,
  };

  const positionals: string[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const token = raw[index];
    if (!token) {
      continue;
    }

    const next = raw[index + 1];

    if (token === "--from") {
      if (!next) throw new CliError("Missing value for --from", ExitCode.InvalidArgs);
      options.from = next;
      index += 1;
      continue;
    }
    if (token === "--to") {
      if (!next) throw new CliError("Missing value for --to", ExitCode.InvalidArgs);
      options.to = next;
      index += 1;
      continue;
    }
    if (token === "--output") {
      if (!next) throw new CliError("Missing value for --output", ExitCode.InvalidArgs);
      options.output = next;
      index += 1;
      continue;
    }
    if (token === "--timeout") {
      options.timeoutMs = parseNumber(next, 0, "--timeout");
      index += 1;
      continue;
    }
    if (token === "--max-steps") {
      options.maxSteps = parseNumber(next, DEFAULT_MAX_STEPS, "--max-steps");
      index += 1;
      continue;
    }
    if (token === "--max-candidates") {
      options.maxCandidates = parseNumber(next, DEFAULT_MAX_CANDIDATES, "--max-candidates");
      index += 1;
      continue;
    }

    if (token === "--force") {
      options.force = true;
      continue;
    }
    if (token === "--strict") {
      options.strict = true;
      continue;
    }
    if (token === "--json") {
      options.json = true;
      continue;
    }
    if (token === "--verbose") {
      options.verbose = true;
      continue;
    }
    if (token === "--quiet") {
      options.quiet = true;
      continue;
    }
    if (token === "--show-route") {
      options.showRoute = true;
      continue;
    }
    if (token === "--keep-temp") {
      options.keepTemp = true;
      continue;
    }

    if (token.startsWith("--")) {
      throw new CliError(`Unknown option: ${token}`, ExitCode.InvalidArgs);
    }

    positionals.push(token);
  }

  return {
    command,
    positionals,
    options,
  };
}
