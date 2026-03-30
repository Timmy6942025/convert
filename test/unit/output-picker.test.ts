import { expect, test } from "bun:test";
import { buildDefaultOutputPath } from "../../src/cli/output-picker.ts";

test("buildDefaultOutputPath replaces extension with selected format", () => {
  const path = buildDefaultOutputPath("/tmp/sample.input.txt", {
    id: "json",
    name: "JSON",
    extension: "json",
    mime: "application/json",
    category: ["data", "text"],
    aliases: [],
  });

  expect(path).toBe("/tmp/sample.input.json");
});
