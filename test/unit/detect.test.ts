import { expect, test } from "bun:test";
import { detectInputFormat, resolveOutputFormat } from "../../src/formats/detect.ts";
import { FormatRegistry } from "../../src/formats/registry.ts";

test("detects input format from extension", () => {
  const registry = new FormatRegistry();
  const format = detectInputFormat("/tmp/photo.jpg", undefined, registry);
  expect(format.id).toBe("jpeg");
});

test("resolves output format from --to", () => {
  const registry = new FormatRegistry();
  const format = resolveOutputFormat(undefined, "pdf", registry);
  expect(format.id).toBe("pdf");
});
