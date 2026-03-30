import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BundleResolver } from "../../src/bundle/resolve.ts";
import { buildPlanOptions } from "../../src/core/config.ts";
import { ConsoleLogger } from "../../src/core/logger.ts";
import { ConversionEngine } from "../../src/executor/executor.ts";
import { FormatRegistry } from "../../src/formats/registry.ts";
import { BinaryBridgeHandler } from "../../src/handlers/bridges/binary.ts";
import { TextBridgeHandler } from "../../src/handlers/bridges/text.ts";
import { HandlerRegistry } from "../../src/handlers/registry.ts";

test("engine converts txt to json via text bridge", async () => {
  const dir = await mkdtemp(join(tmpdir(), "convert-e2e-"));
  const inputPath = join(dir, "input.txt");
  const outputPath = join(dir, "output.json");

  await writeFile(inputPath, "hello");

  const formats = new FormatRegistry();
  const handlers = new HandlerRegistry([new TextBridgeHandler(), new BinaryBridgeHandler()]);
  const bundle = new BundleResolver();
  const logger = new ConsoleLogger(false, true);
  const engine = new ConversionEngine(formats, handlers, bundle, logger);

  const inputFormat = formats.getById("txt");
  const outputFormat = formats.getById("json");
  if (!inputFormat || !outputFormat) {
    throw new Error("Required test formats missing");
  }

  const result = await engine.execute({
    inputPath,
    outputPath,
    inputFormat,
    outputFormat,
    strict: false,
    keepTemp: false,
    plan: buildPlanOptions({
      strict: false,
      maxSteps: 4,
      maxCandidates: 5,
    }),
  });

  const output = await readFile(outputPath, "utf8");
  expect(result.route.edges.length).toBeGreaterThan(0);
  expect(output.includes('"data": "hello"')).toBeTrue();

  await rm(dir, { recursive: true, force: true });
});
