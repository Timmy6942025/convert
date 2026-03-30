# fconvert

Fast local CLI conversion tool with graph-based anything-to-anything routing.

The built-in registry includes 100+ file formats across image, audio, video, document,
data, archive, code, and font categories.

## Quick start

```bash
npm install -g fconvert
fconvert formats
```

For local source development, use Bun:

```bash
bun install
bun run convert formats
```

## Commands

```bash
bun run convert <input> [output]
bun run convert route <input> --to <format>
bun run convert formats
bun run convert handlers
bun run convert doctor
```

If you omit output and `--to`, an interactive Bubble Tea fuzzy picker appears so you can select the output format.
The output file defaults to the input basename with the selected extension.

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

The distributable Node CLI is written to `dist/main.js`.

The published npm package ships prebuilt JavaScript plus `assets/`, so it installs under Node
without requiring Bun or the Go-based picker helper at runtime.

## Project structure

- `src/cli`: command parsing and command entrypoints
- `src/formats`: format registry and detection
- `src/handlers`: native and bridge handlers
- `src/planner`: weighted route graph and search
- `src/executor`: workspace and route execution
- `src/bundle`: bundled binary resolution
- `src/diagnostics`: doctor checks
