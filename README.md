# convert-cli

Fast local CLI conversion tool with graph-based anything-to-anything routing.

## Quick start

```bash
bun install
bun run start formats
```

## Commands

```bash
bun run start <input> <output>
bun run start route <input> --to <format>
bun run start formats
bun run start handlers
bun run start doctor
```

## Useful flags

```bash
--from <format>
--to <format>
--output <path>
--force
--strict
--show-route
--json
--verbose
--keep-temp
--max-steps <n>
--max-candidates <n>
```

## Build

```bash
bun run build
```

Compiled binary is written to `dist/convert`.

## Project structure

- `src/cli`: command parsing and command entrypoints
- `src/formats`: format registry and detection
- `src/handlers`: native and bridge handlers
- `src/planner`: weighted route graph and search
- `src/executor`: workspace and route execution
- `src/bundle`: bundled binary resolution
- `src/diagnostics`: doctor checks
